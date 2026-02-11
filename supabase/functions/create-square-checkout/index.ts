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

    // Get secrets from environment variables
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const SQUARE_ENVIRONMENT = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox'
    const SQUARE_API_URL = SQUARE_ENVIRONMENT === 'production'
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com"

    if (!SQUARE_ACCESS_TOKEN) {
      throw new Error('Square Access Token is not configured in environment variables.')
    }

    // Use location ID from request, environment, or default sandbox location
    const locationId = requestLocationId || Deno.env.get('SQUARE_LOCATION_ID') || "L09Y3ZCB23S11"

    console.log(`[CreateSquareCheckout] Creating checkout for order: ${orderDetails.id} in ${SQUARE_ENVIRONMENT} environment`)

    const body = {
      idempotency_key: crypto.randomUUID(),
      checkout_options: {
        redirect_url: `${req.headers.get('origin')}/checkout/success`,
        ask_for_shipping_address: false
      },
      order: {
        location_id: locationId,
        line_items: orderDetails.items.map((item: any) => ({
          name: item.title,
          quantity: item.quantity.toString(),
          base_price_money: {
            amount: Math.round(parseFloat(item.price) * 100),
            currency: "USD"
          }
        }))
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
