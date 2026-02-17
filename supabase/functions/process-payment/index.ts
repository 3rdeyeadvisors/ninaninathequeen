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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const SQUARE_ENVIRONMENT = Deno.env.get('SQUARE_ENVIRONMENT') || 'production';

    const { sourceId, amount, currency, locationId: requestLocationId, orderDetails } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const FINAL_SQUARE_TOKEN = SQUARE_ACCESS_TOKEN?.trim();

    if (!FINAL_SQUARE_TOKEN) {
      throw new Error('Square Access Token is not configured.')
    }

    // === SERVER-SIDE PRICE VALIDATION ===
    if (orderDetails?.items && Array.isArray(orderDetails.items)) {
      const productIds = orderDetails.items.map((item: any) => item.productId).filter(Boolean);
      if (productIds.length > 0) {
        const { data: products, error: dbError } = await supabase
          .from('products')
          .select('id, price')
          .in('id', productIds);

        if (dbError) {
          console.error('[ProcessPayment] DB error fetching prices:', dbError.message);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to verify product prices. Please try again.'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const dbPrices: Record<string, string> = {};
        for (const p of (products || [])) {
          dbPrices[p.id] = p.price;
        }

        for (const item of orderDetails.items) {
          const clientPrice = parseFloat(item.price);
          if (item.productId && dbPrices[item.productId] !== undefined) {
            const dbPrice = parseFloat(dbPrices[item.productId]);
            if (Math.abs(clientPrice - dbPrice) > 0.01) {
              console.error(`[ProcessPayment] PRICE MISMATCH for ${item.title}: client=$${clientPrice}, db=$${dbPrice}`);
              return new Response(JSON.stringify({
                success: false,
                error: `Price mismatch detected for "${item.title}". Please refresh and try again.`
              }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }
        }
      }
    }

    const SQUARE_API_URL = (SQUARE_ENVIRONMENT === 'sandbox')
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    // Use location ID from environment secret, then request, then fallback
    const locationId = Deno.env.get('SQUARE_LOCATION_ID') || requestLocationId || 'L09Y3ZCB23S11';

    console.log(`[ProcessPayment] Processing payment in ${SQUARE_API_URL.includes('sandbox') ? 'sandbox' : 'production'} environment at location: ${locationId}`);

    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

    try {
      const paymentResponse = await fetch(`${SQUARE_API_URL}/v2/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FINAL_SQUARE_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2025-01-23'
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          source_id: sourceId,
          amount_money: {
            amount: Math.round(parseFloat(amount) * 100),
            currency: currency || 'USD'
          },
          location_id: locationId
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      console.log(`[ProcessPayment] Square API responded in ${duration}ms with status: ${paymentResponse.status}`)

      const paymentResult = await paymentResponse.json()

      if (!paymentResponse.ok) {
        console.error('[ProcessPayment] Square API error:', paymentResult)
        return new Response(JSON.stringify({
          success: false,
          error: paymentResult.errors?.[0]?.detail || 'Payment failed'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

    if (orderDetails) {
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderDetails.id || `#ORD-${Math.floor(Math.random() * 9000) + 1000}`,
          customer_name: orderDetails.customerName,
          customer_email: orderDetails.customerEmail,
          date: new Date().toISOString().split('T')[0],
          total: amount,
          status: 'Pending',
          items: orderDetails.items,
          shipping_cost: orderDetails.shippingCost,
          item_cost: orderDetails.itemCost,
          tracking_number: 'Pending'
        })

      if (orderDetails.items && Array.isArray(orderDetails.items)) {
        for (const item of orderDetails.items) {
          try {
            const { data: product, error: fetchError } = await supabase
              .from('products')
              .select('id, inventory, size_inventory')
              .eq('id', item.productId)
              .single();

            if (!fetchError && product) {
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
            console.error('[ProcessPayment] Inventory update error:', invErr);
          }
        }
      }
    }

      return new Response(JSON.stringify({ success: true, payment: paymentResult.payment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('[ProcessPayment] Square API request timed out')
        throw new Error('Square API request timed out after 20 seconds')
      }
      throw fetchError
    }

  } catch (error: any) {
    console.error('[ProcessPayment] Unexpected error:', error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
