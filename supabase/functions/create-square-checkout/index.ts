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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  console.time('TotalExecutionTime');
  try {
    console.time('RequestBodyParsing');
    const { orderDetails, locationId: requestLocationId } = await req.json()
    console.timeEnd('RequestBodyParsing');

    if (!orderDetails || !orderDetails.id) {
      throw new Error('Order details are missing or invalid.');
    }

    // Get secrets from environment variables
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')?.trim()
    const SQUARE_ENVIRONMENT = Deno.env.get('SQUARE_ENVIRONMENT') || 'sandbox'

    console.log(`[CreateSquareCheckout] Environment: ${SQUARE_ENVIRONMENT}`)

    if (!SQUARE_ACCESS_TOKEN) {
      throw new Error('Square Access Token is not configured.')
    }

    if (SQUARE_ACCESS_TOKEN.length < 10) {
      throw new Error('Square Access Token appears to be invalid (too short).')
    }

    const SQUARE_API_URL = (SQUARE_ENVIRONMENT === 'sandbox')
      ? "https://connect.squareupsandbox.com"
      : "https://connect.squareup.com"

    // Use location ID from environment secret first, then request, then fallback to Sandbox default
    const locationId = Deno.env.get('SQUARE_LOCATION_ID') || requestLocationId || 'L09Y3ZCB23S11'

    // Ensure we have a valid origin for redirects, and sanitize it
    let origin = req.headers.get('origin') || 'https://ninaarmend.com'
    if (origin.endsWith('/')) {
      origin = origin.slice(0, -1)
    }

    console.log(`[CreateSquareCheckout] Creating checkout for order: ${orderDetails.id} at location: ${locationId}`)

    // === SERVER-SIDE PRICE VALIDATION ===
    // Fetch real prices from the database to prevent client-side price manipulation
    const line_items = []

    if (orderDetails.items && Array.isArray(orderDetails.items)) {
      // Collect all product IDs for a batch lookup
      const productIds = orderDetails.items.map((item: any) => item.productId).filter(Boolean);
      
      let dbProducts: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: products, error: dbError } = await supabase
          .from('products')
          .select('id, price')
          .in('id', productIds);
        
        if (dbError) {
          console.error('[CreateSquareCheckout] DB error fetching prices:', dbError.message);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to verify product prices. Please try again.'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        for (const p of (products || [])) {
          dbProducts[p.id] = p.price;
        }
      }

      for (const item of orderDetails.items) {
        const clientPrice = parseFloat(item.price);
        if (isNaN(clientPrice)) {
          console.warn(`[CreateSquareCheckout] Invalid price for item ${item.title}: ${item.price}`);
          continue;
        }

        // Verify price against database
        if (item.productId && dbProducts[item.productId] !== undefined) {
          const dbPrice = parseFloat(dbProducts[item.productId]);
          if (Math.abs(clientPrice - dbPrice) > 0.01) {
            console.error(`[CreateSquareCheckout] PRICE MISMATCH for ${item.title}: client=$${clientPrice}, db=$${dbPrice}`);
            return new Response(JSON.stringify({
              success: false,
              error: `Price mismatch detected for "${item.title}". Please refresh and try again.`
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        line_items.push({
          name: `${item.title}${item.size ? ` (${item.size})` : ''}`,
          quantity: item.quantity.toString(),
          base_price_money: {
            amount: Math.round(clientPrice * 100),
            currency: "USD"
          }
        });
      }
    }

    // Add Shipping - Include even if cost is 0 as requested by the user
    const shippingCost = parseFloat(orderDetails.shippingCost || '0')
    if (!isNaN(shippingCost)) {
      line_items.push({
        name: "Shipping",
        quantity: "1",
        base_price_money: {
          amount: Math.round(shippingCost * 100),
          currency: "USD"
        }
      })
    }

    // Add Tax as a line item if provided and > 0
    const taxAmount = parseFloat(orderDetails.taxAmount || '0')
    if (!isNaN(taxAmount) && taxAmount > 0) {
      line_items.push({
        name: "Tax",
        quantity: "1",
        base_price_money: {
          amount: Math.round(taxAmount * 100),
          currency: "USD"
        }
      });
    }

    if (line_items.length === 0) {
      throw new Error('No valid items found to create a checkout session.')
    }

    const body: any = {
      idempotency_key: crypto.randomUUID(),
      checkout_options: {
        redirect_url: `${origin}/checkout/success?orderId=${encodeURIComponent(orderDetails.id)}`,
        ask_for_shipping_address: true,
      },
      order: {
        location_id: locationId,
        line_items: line_items
      }
    }

    // Pre-populate customer email if available
    if (orderDetails.customerEmail) {
      body.pre_populated_data = {
        customer_info: {
          email_address: orderDetails.customerEmail
        }
      }
    }

    console.log(`[CreateSquareCheckout] Sending request to Square API: ${SQUARE_API_URL}/v2/online-checkout/payment-links`)

    // Add a timeout to the fetch call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

    console.time('SquareAPICall');
    try {
      const response = await fetch(`${SQUARE_API_URL}/v2/online-checkout/payment-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2025-01-23'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.timeEnd('SquareAPICall');

      const result = await response.json()

      if (!response.ok) {
        console.error('[CreateSquareCheckout] Square API error details:', JSON.stringify(result))
        const errorDetail = result.errors?.[0]?.detail || result.errors?.[0]?.category || 'Failed to create checkout'
        return new Response(JSON.stringify({
          success: false,
          error: `${errorDetail} (Square Status: ${response.status})`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log(`[CreateSquareCheckout] Square API success. Order ID: ${result.payment_link.order_id}`)

      // Save order to database as Pending with Square Order ID (using upsert to avoid conflicts)
      console.log('[CreateSquareCheckout] Saving/Updating order in database...')
      console.time('DBSaveOrder');
      const { error: orderError } = await supabase
        .from('orders')
        .upsert({
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
          square_order_id: result.payment_link.order_id,
          updated_at: new Date().toISOString()
        })
      console.timeEnd('DBSaveOrder');

      if (orderError) {
        console.error('[CreateSquareCheckout] DB Error saving order:', orderError.message)
      } else {
        console.log('[CreateSquareCheckout] Order record synced successfully.')
      }

      console.timeEnd('TotalExecutionTime');
      return new Response(JSON.stringify({
        success: true,
        url: result.payment_link.url
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('[CreateSquareCheckout] Square API request timed out after 20s')
        return new Response(JSON.stringify({
          success: false,
          error: 'Square API request timed out. Please try again.'
        }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
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
