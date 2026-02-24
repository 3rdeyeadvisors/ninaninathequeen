import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Move client initialization outside to benefit from reuse
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.time('FinalizeOrder_TotalExecutionTime');
  try {
    // Clean up legacy stale Pending orders (older than 1 hour) — safety net for old data
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: staleOrders, error: staleError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'Pending')
        .lt('created_at', oneHourAgo);
      
      if (!staleError && staleOrders && staleOrders.length > 0) {
        const staleIds = staleOrders.map(o => o.id);
        await supabase
          .from('orders')
          .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
          .in('id', staleIds);
        console.log(`[FinalizeSquareOrder] Cancelled ${staleIds.length} stale Pending orders`);
      }
    } catch (cleanupErr) {
      console.error('[FinalizeSquareOrder] Stale order cleanup error (non-critical):', cleanupErr);
    }

    const { squareOrderId, metadata } = await req.json()
    if (!squareOrderId && !metadata) {
      throw new Error('Square Order ID or order metadata is required')
    }

    // Get secrets
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')?.trim()
    const SQUARE_ENVIRONMENT = Deno.env.get('SQUARE_ENVIRONMENT') || 'production'

    if (!SQUARE_ACCESS_TOKEN) {
      throw new Error('Square Access Token is not configured.')
    }

    const SQUARE_API_URL = (SQUARE_ENVIRONMENT === 'sandbox')
      ? "https://connect.squareupsandbox.com"
      : "https://connect.squareup.com"

    // Verify order with Square
    console.log(`[FinalizeSquareOrder] Verifying Square Order: ${squareOrderId} at ${SQUARE_API_URL}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    console.time('FinalizeOrder_SquareAPICall');
    try {
      const squareResponse = await fetch(`${SQUARE_API_URL}/v2/orders/${squareOrderId}`, {
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Square-Version': '2025-01-23',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId)
      console.timeEnd('FinalizeOrder_SquareAPICall');

      const result = await squareResponse.json();

      if (!squareResponse.ok) {
        console.error(`[FinalizeSquareOrder] Square API Error (Status ${squareResponse.status}):`, result)
        throw new Error(`Failed to fetch order from Square: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      const { order: squareOrder } = result;
      console.log(`[FinalizeSquareOrder] Square API success. State: ${squareOrder.state}`)

      // Check if order is paid
      const totalAmount = squareOrder.total_money?.amount || 0;
      const paidAmount = squareOrder.total_paid_money?.amount || 0;

      const isPaid = (squareOrder.state === 'COMPLETED') ||
                     (squareOrder.state === 'OPEN' && (paidAmount >= totalAmount || squareOrder.tenders?.length > 0));

      if (!isPaid) {
        console.warn(`[FinalizeSquareOrder] Order not yet fully paid. State: ${squareOrder.state}, Paid: ${paidAmount}/${totalAmount}`)
        throw new Error(`Payment verification pending. Current state: ${squareOrder.state}`);
      }

      // Extract shipping address from Square
      let shippingAddress = null;
      if (squareOrder.fulfillments && squareOrder.fulfillments.length > 0) {
        const fulfillment = squareOrder.fulfillments[0];
        if (fulfillment.shipment_details && fulfillment.shipment_details.recipient) {
          shippingAddress = fulfillment.shipment_details.recipient.address;
        } else if (fulfillment.pickup_details && fulfillment.pickup_details.recipient) {
          shippingAddress = fulfillment.pickup_details.recipient.address;
        }
      }

      // Use metadata passed from the checkout flow to create the order
      if (!metadata) {
        throw new Error('Order metadata is required to create the order record.');
      }

      const orderId = `#ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      console.log(`[FinalizeSquareOrder] Creating order ${orderId} with status 'Processing'`)

      // INSERT the order — this is the first time it's written to the database
      console.time('FinalizeOrder_DBInsertOrder');
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          customer_name: metadata.customerName || 'Customer',
          customer_email: metadata.customerEmail || '',
          date: new Date().toISOString().split('T')[0],
          total: metadata.total || '0.00',
          status: 'Processing',
          items: metadata.items || [],
          shipping_cost: metadata.shippingCost || '0.00',
          item_cost: metadata.itemCost || '0.00',
          discount_amount: parseFloat(metadata.discountAmount || '0') || 0,
          discount_type: metadata.discountType || null,
          tracking_number: '',
          square_order_id: squareOrderId,
          shipping_address: shippingAddress,
        });
      console.timeEnd('FinalizeOrder_DBInsertOrder');

      if (insertError) {
        console.error(`[FinalizeSquareOrder] DB Insert Error:`, insertError.message)
        throw new Error(`Failed to create order record: ${insertError.message}`);
      }

      // Decrement Inventory
      console.log(`[FinalizeSquareOrder] Decrementing inventory for items in order ${orderId}`)
      console.time('FinalizeOrder_InventoryUpdate');
      const items = metadata.items;
      if (items && Array.isArray(items)) {
        for (const item of items) {
          try {
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('id, inventory, size_inventory')
              .eq('id', item.productId)
              .maybeSingle();

            if (!productError && product) {
              const currentTotal = product.inventory || 0;
              const newTotal = Math.max(0, currentTotal - item.quantity);
              const sizeInventory = { ...(product.size_inventory as Record<string, number> || {}) };

              const sizeKey = Object.keys(sizeInventory).find(k => k.toLowerCase() === (item.size || '').toLowerCase()) || item.size;

              if (sizeKey) {
                sizeInventory[sizeKey] = Math.max(0, (sizeInventory[sizeKey] || 0) - item.quantity);

                await supabase
                  .from('products')
                  .update({
                    inventory: newTotal,
                    size_inventory: sizeInventory,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', item.productId);

                console.log(`[FinalizeSquareOrder] Updated inventory for product ${item.productId}, size ${sizeKey}`)
              }
            }
          } catch (invErr) {
            console.error(`[FinalizeSquareOrder] Inventory update error for product ${item.productId}:`, invErr);
          }
        }
      }
      console.timeEnd('FinalizeOrder_InventoryUpdate');

      // Award loyalty points (1 point per $1 spent) and deduct if used
      console.log(`[FinalizeSquareOrder] Updating loyalty points for order ${orderId}`);
      try {
        const orderTotal = parseFloat(metadata.total) || 0;
        const pointsToAward = Math.floor(orderTotal);
        const pointsUsed = metadata.discountType === 'Points Redemption' ? 500 : 0;

        if (metadata.customerEmail) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, points')
            .eq('email', metadata.customerEmail)
            .maybeSingle();

          if (profile) {
            const currentPoints = profile.points || 0;
            const newPoints = Math.max(0, currentPoints - pointsUsed + pointsToAward);

            await supabase
              .from('profiles')
              .update({ points: newPoints })
              .eq('id', profile.id);

            console.log(`[FinalizeSquareOrder] Updated points for ${metadata.customerEmail}: ${currentPoints} -> ${newPoints} (Used: ${pointsUsed}, Earned: ${pointsToAward})`);
          }
        }
      } catch (pointsErr) {
        console.error('[FinalizeSquareOrder] Points award error:', pointsErr);
      }

      // Send order confirmation email
      try {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (RESEND_API_KEY && metadata.customerEmail) {
          const emailItems = Array.isArray(metadata.items) ? (metadata.items as Array<{ title?: string; name?: string; quantity: number; price: string; size?: string }>) : [];
          const emailBody = {
            type: 'order_confirmation',
            data: {
              orderId: orderId,
              customerName: metadata.customerName,
              customerEmail: metadata.customerEmail,
              items: emailItems.map(i => ({ title: i.title || i.name || 'Item', quantity: i.quantity || 1, price: i.price || '0', size: i.size })),
              total: metadata.total,
            },
          };
          const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify(emailBody),
          });
          if (!emailRes.ok) {
            console.error('[FinalizeSquareOrder] Email send failed:', await emailRes.text());
          } else {
            console.log('[FinalizeSquareOrder] Order confirmation email sent to', metadata.customerEmail);
          }
        }
      } catch (emailErr) {
        console.error('[FinalizeSquareOrder] Email error (non-critical):', emailErr);
      }

      console.timeEnd('FinalizeOrder_TotalExecutionTime');
      return new Response(JSON.stringify({ success: true, orderId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('[FinalizeSquareOrder] Square API request timed out after 20s')
        throw new Error('Square API request timed out. Verification will be retried on next page load.')
      }
      throw fetchError
    }

  } catch (error: any) {
    console.error('[FinalizeSquareOrder] Error:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
