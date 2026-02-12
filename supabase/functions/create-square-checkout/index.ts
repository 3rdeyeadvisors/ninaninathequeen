import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const { orderDetails, locationId: requestLocationId } = await req.json()

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get secrets from environment variables or database
    let SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const SQUARE_ENVIRONMENT = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox'

    console.log(`[CreateSquareCheckout] Environment: ${SQUARE_ENVIRONMENT}`)

    if (!SQUARE_ACCESS_TOKEN) {
      console.log('[CreateSquareCheckout] Access token not in env, fetching from DB...')
      const { data: settings, error: settingsError } = await supabase
        .from('store_settings')
        .select('square_api_key')
        .limit(1)
        .maybeSingle();

      if (settingsError) {
        console.error('[CreateSquareCheckout] DB error fetching settings:', settingsError)
      }
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

    // Use location ID from environment secret first, then request, then fallback to Sandbox default
    const locationId = Deno.env.get('SQUARE_LOCATION_ID') || requestLocationId || 'L09Y3ZCB23S11'

    // Ensure we have a valid origin for redirects
    const origin = req.headers.get('origin') || 'https://ninaarmend.com'

    console.log(`[CreateSquareCheckout] Creating checkout for order: ${orderDetails.id} at location: ${locationId}`)

    const body: any = {
      idempotency_key: crypto.randomUUID(),
      checkout_options: {
        redirect_url: `${origin}/checkout/success?orderId=${encodeURIComponent(orderDetails.id)}`,
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
        customer_info: {
          email_address: orderDetails.customerEmail
        }
      }
    }

    console.log('[CreateSquareCheckout] Sending request to Square API...')
    const startTime = Date.now()

    // Add a timeout to the fetch call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

    try {
      const response = await fetch(`${SQUARE_API_URL}/v2/online-checkout/payment-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      console.log(`[CreateSquareCheckout] Square API responded in ${duration}ms with status: ${response.status}`)

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
      console.log('[CreateSquareCheckout] Saving order to database...')
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

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('[CreateSquareCheckout] Square API request timed out')
        throw new Error('Square API request timed out after 20 seconds')
      }
      throw fetchError
    }

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
