import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orderId } = await req.json()
    if (!orderId) {
      throw new Error('Order ID is required')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch internal order
    console.log(`[FinalizeSquareOrder] Fetching order ${orderId} from DB...`)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

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
      const { data: settings } = await supabase
        .from('store_settings')
        .select('square_api_key')
        .limit(1)
        .maybeSingle();
      SQUARE_ACCESS_TOKEN = settings?.square_api_key;
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

    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

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
      const duration = Date.now() - startTime

      const result = await squareResponse.json();

      if (!squareResponse.ok) {
        console.error(`[FinalizeSquareOrder] Square API Error (Status ${squareResponse.status}):`, result)
        throw new Error(`Failed to fetch order from Square: ${result.errors?.[0]?.detail || 'Unknown error'}`);
      }

      const { order: squareOrder } = result;
      console.log(`[FinalizeSquareOrder] Square API success in ${duration}ms. State: ${squareOrder.state}`)

      // Check if order is paid
      // In Square, an order created via payment link and paid will have a state of 'OPEN' or 'COMPLETED'
      const isPaid = squareOrder.state === 'OPEN' || squareOrder.state === 'COMPLETED';

      if (!isPaid) {
        console.warn(`[FinalizeSquareOrder] Order ${orderId} not yet paid. State: ${squareOrder.state}`)
        throw new Error(`Payment verification pending. Current state: ${squareOrder.state}`);
      }

      // Extract shipping address - checking multiple potential locations in the order object
      let shippingAddress = null;
      if (squareOrder.fulfillments && squareOrder.fulfillments.length > 0) {
        const fulfillment = squareOrder.fulfillments[0];
        if (fulfillment.shipment_details && fulfillment.shipment_details.recipient) {
          shippingAddress = fulfillment.shipment_details.recipient.address;
        } else if (fulfillment.pickup_details && fulfillment.pickup_details.recipient) {
          // Fallback to pickup recipient address if shipment is missing but pickup exists
          shippingAddress = fulfillment.pickup_details.recipient.address;
        }
      }

      // If no fulfillment address, check the tenders/payments for card billing address as a last resort
      // (Note: Square Payment Links usually put address in fulfillments)

      console.log(`[FinalizeSquareOrder] Transitioning order ${orderId} to 'Processing'`)

      // Update internal order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'Processing',
          shipping_address: shippingAddress,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error(`[FinalizeSquareOrder] DB Update Error:`, updateError.message)
        throw new Error(`Failed to update internal order: ${updateError.message}`);
      }

      // Decrement Inventory
      console.log(`[FinalizeSquareOrder] Decrementing inventory for items in order ${orderId}`)
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

              // Find matching size key (case-insensitive)
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
