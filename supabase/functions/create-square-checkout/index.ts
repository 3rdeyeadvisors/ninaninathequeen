import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orderDetails, locationId: requestLocationId } = await req.json()

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get secrets from environment variables or database
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

    // Determine API URL based on environment or token prefix
    const SQUARE_API_URL = (SQUARE_ENVIRONMENT === 'production' && !SQUARE_ACCESS_TOKEN.startsWith('EAAAl'))
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com"

    // Use location ID from request, environment, or default sandbox location
    const locationId = requestLocationId || Deno.env.get('SQUARE_LOCATION_ID') || "L09Y3ZCB23S11"

    console.log(`[CreateSquareCheckout] Creating checkout for order: ${orderDetails.id} in ${SQUARE_ENVIRONMENT} environment`)

    const body: any = {
      idempotency_key: crypto.randomUUID(),
      checkout_options: {
        redirect_url: `${req.headers.get('origin')}/checkout/success?orderId=${encodeURIComponent(orderDetails.id)}`,
        ask_for_shipping_address: true,
      },
      order: {
        location_id: locationId,
        line_items: [
          ...orderDetails.items.map((item: any) => ({
            name: `${item.title}${item.size ? ` (${item.size})` : ''}`,
            quantity: item.quantity.toString(),
            base_price_money: {
              amount: Math.round(parseFloat(item.price) * 100),
              currency: "USD"
            }
          })),
          {
            name: "Shipping",
            quantity: "1",
            base_price_money: {
              amount: Math.round(parseFloat(orderDetails.shippingCost) * 100),
              currency: "USD"
            }
          }
        ]
      }
    }

    // Add Tax as a line item if provided
    if (orderDetails.taxAmount && parseFloat(orderDetails.taxAmount) > 0) {
      body.order.line_items.push({
        name: "Tax",
        quantity: "1",
        base_price_money: {
          amount: Math.round(parseFloat(orderDetails.taxAmount) * 100),
          currency: "USD"
        }
      });
    }

    // Pre-populate if we have the data
    if (orderDetails.customerEmail) {
      body.pre_populated_data = {
        customer_browser_details: {
          email_address: orderDetails.customerEmail
        }
      }
    }

    const response = await fetch(`${SQUARE_API_URL}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18'
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[CreateSquareCheckout] Square API error:', result)
      return new Response(JSON.stringify({
        success: false,
        error: result.errors?.[0]?.detail || 'Failed to create checkout'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Save order to database as Pending with Square Order ID
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderDetails.id,
        customer_name: orderDetails.customerName || 'Pending Customer',
        customer_email: orderDetails.customerEmail || 'pending@email.com',
        date: new Date().toISOString().split('T')[0],
        total: orderDetails.total,
        status: 'Pending',
        items: orderDetails.items,
        shipping_cost: orderDetails.shippingCost,
        item_cost: orderDetails.itemCost, // COGS
        tracking_number: 'Pending',
        square_order_id: result.payment_link.order_id
      })

    if (orderError) {
      console.error('[CreateSquareCheckout] Error saving order:', orderError)
    }

    return new Response(JSON.stringify({
      success: true,
      url: result.payment_link.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('[CreateSquareCheckout] Unexpected error:', error.message)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
