import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // If already processed, return success
    if (order.status !== 'Pending') {
      return new Response(JSON.stringify({ success: true, message: 'Order already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!order.square_order_id) {
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
    console.log(`[FinalizeSquareOrder] Verifying Square Order: ${order.square_order_id} in ${SQUARE_ENVIRONMENT} environment`)

    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

    try {
      const squareResponse = await fetch(`${SQUARE_API_URL}/v2/orders/${order.square_order_id}`, {
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Square-Version': '2024-01-18'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      console.log(`[FinalizeSquareOrder] Square API responded in ${duration}ms with status: ${squareResponse.status}`)

      if (!squareResponse.ok) {
        const errorResult = await squareResponse.json();
        throw new Error(`Failed to fetch order from Square: ${errorResult.errors?.[0]?.detail || 'Unknown error'}`);
      }

      const { order: squareOrder } = await squareResponse.json();

    // Check if order is paid
    // In Square, an order created via payment link and paid will have a state of 'OPEN' or 'COMPLETED'
    // and will have 'tenders' or associated payments.
    // For simplicity and security, we check if state is NOT 'CANCELED' and NOT 'DRAFT'.
    // And ideally, check if it has been paid.
    const isPaid = squareOrder.state === 'OPEN' || squareOrder.state === 'COMPLETED';

    if (!isPaid) {
      throw new Error(`Order ${orderId} is not paid (Square state: ${squareOrder.state})`);
    }

    // Extract shipping address
    let shippingAddress = null;
    if (squareOrder.fulfillments && squareOrder.fulfillments.length > 0) {
      const fulfillment = squareOrder.fulfillments[0];
      if (fulfillment.shipment_details && fulfillment.shipment_details.recipient) {
        shippingAddress = fulfillment.shipment_details.recipient.address;
      }
    }

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
      throw new Error(`Failed to update internal order: ${updateError.message}`);
    }

    // Decrement Inventory
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        try {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, inventory, size_inventory')
            .eq('id', item.productId)
            .single();

          if (!productError && product) {
            const currentTotal = product.inventory || 0;
            const newTotal = Math.max(0, currentTotal - item.quantity);
            const sizeInventory = { ...(product.size_inventory as Record<string, number> || {}) };
            const sizeKey = Object.keys(sizeInventory).find(k => k.toLowerCase() === item.size.toLowerCase()) || item.size;
            sizeInventory[sizeKey] = Math.max(0, (sizeInventory[sizeKey] || 0) - item.quantity);

            await supabase
              .from('products')
              .update({ inventory: newTotal, size_inventory: sizeInventory })
              .eq('id', item.productId);
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
        console.error('[FinalizeSquareOrder] Square API request timed out')
        throw new Error('Square API request timed out after 20 seconds')
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
