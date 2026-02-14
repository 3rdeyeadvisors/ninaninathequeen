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
    // Clean up stale Pending orders (older than 1 hour)
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

    const { orderId } = await req.json()
    if (!orderId) {
      throw new Error('Order ID is required')
    }

    // Fetch internal order
    console.log(`[FinalizeSquareOrder] Fetching order ${orderId} from DB...`)
    console.time('FinalizeOrder_FetchInternalOrder');
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    console.timeEnd('FinalizeOrder_FetchInternalOrder');

    if (fetchError) {
      console.error(`[FinalizeSquareOrder] DB Fetch Error:`, fetchError.message)
      throw new Error(`Failed to fetch order: ${fetchError.message}`);
    }

    if (!order) {
      console.error(`[FinalizeSquareOrder] Order ${orderId} not found in database`)
      throw new Error(`Order ${orderId} not found`);
    }

    // If already processed, return success
    if (order.status !== 'Pending') {
      console.log(`[FinalizeSquareOrder] Order ${orderId} already has status: ${order.status}`)
      return new Response(JSON.stringify({ success: true, message: 'Order already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!order.square_order_id) {
      console.error(`[FinalizeSquareOrder] No Square Order ID associated with order ${orderId}`)
      throw new Error(`Square Order ID not found for order ${orderId}`);
    }

    // Get secrets
    let SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const SQUARE_ENVIRONMENT = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox'

    if (!SQUARE_ACCESS_TOKEN) {
      console.time('FinalizeOrder_FetchSettingsFromDB');
      const { data: settings } = await supabase
        .from('store_settings')
        .select('square_api_key')
        .limit(1)
        .maybeSingle();
      SQUARE_ACCESS_TOKEN = settings?.square_api_key;
      console.timeEnd('FinalizeOrder_FetchSettingsFromDB');
    }

    if (!SQUARE_ACCESS_TOKEN) {
      throw new Error('Square Access Token is not configured.')
    }

    // Trim whitespace from token
    SQUARE_ACCESS_TOKEN = SQUARE_ACCESS_TOKEN.trim()

    const SQUARE_API_URL = (SQUARE_ENVIRONMENT === 'sandbox')
      ? "https://connect.squareupsandbox.com"
      : "https://connect.squareup.com"

    // Verify order with Square
    console.log(`[FinalizeSquareOrder] Verifying Square Order: ${order.square_order_id} at ${SQUARE_API_URL}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

    console.time('FinalizeOrder_SquareAPICall');
    try {
      const squareResponse = await fetch(`${SQUARE_API_URL}/v2/orders/${order.square_order_id}`, {
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Square-Version': '2024-01-18',
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
      const isPaid = squareOrder.state === 'OPEN' || squareOrder.state === 'COMPLETED';

      if (!isPaid) {
        console.warn(`[FinalizeSquareOrder] Order ${orderId} not yet paid. State: ${squareOrder.state}`)
        throw new Error(`Payment verification pending. Current state: ${squareOrder.state}`);
      }

      // Extract shipping address
      let shippingAddress = null;
      if (squareOrder.fulfillments && squareOrder.fulfillments.length > 0) {
        const fulfillment = squareOrder.fulfillments[0];
        if (fulfillment.shipment_details && fulfillment.shipment_details.recipient) {
          shippingAddress = fulfillment.shipment_details.recipient.address;
        } else if (fulfillment.pickup_details && fulfillment.pickup_details.recipient) {
          shippingAddress = fulfillment.pickup_details.recipient.address;
        }
      }

      console.log(`[FinalizeSquareOrder] Transitioning order ${orderId} to 'Processing'`)

      // Update internal order
      console.time('FinalizeOrder_DBUpdateOrder');
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'Processing',
          shipping_address: shippingAddress,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      console.timeEnd('FinalizeOrder_DBUpdateOrder');

      if (updateError) {
        console.error(`[FinalizeSquareOrder] DB Update Error:`, updateError.message)
        throw new Error(`Failed to update internal order: ${updateError.message}`);
      }

      // Decrement Inventory
      console.log(`[FinalizeSquareOrder] Decrementing inventory for items in order ${orderId}`)
      console.time('FinalizeOrder_InventoryUpdate');
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
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

      // Award loyalty points (1 point per $1 spent)
      console.log(`[FinalizeSquareOrder] Awarding loyalty points for order ${orderId}`);
      try {
        const orderTotal = parseFloat(order.total) || 0;
        const pointsToAward = Math.floor(orderTotal);
        if (pointsToAward > 0 && order.customer_email) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, points')
            .eq('email', order.customer_email)
            .maybeSingle();

          if (profile) {
            await supabase
              .from('profiles')
              .update({ points: (profile.points || 0) + pointsToAward })
              .eq('id', profile.id);
            console.log(`[FinalizeSquareOrder] Awarded ${pointsToAward} points to ${order.customer_email}`);
          }
        }
      } catch (pointsErr) {
        console.error('[FinalizeSquareOrder] Points award error:', pointsErr);
        // Non-critical, don't fail the order
      }

      // Send order confirmation email
      try {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (RESEND_API_KEY && order.customer_email) {
          const items = Array.isArray(order.items) ? (order.items as Array<{ title?: string; name?: string; quantity: number; price: string; size?: string }>) : [];
          const emailBody = {
            type: 'order_confirmation',
            data: {
              orderId: order.id,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              items: items.map(i => ({ title: i.title || i.name || 'Item', quantity: i.quantity || 1, price: i.price || '0', size: i.size })),
              total: order.total,
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
            console.log('[FinalizeSquareOrder] Order confirmation email sent to', order.customer_email);
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
