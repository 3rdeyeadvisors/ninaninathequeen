import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SquareInventoryCount {
  catalog_object_id: string
  location_id: string
  quantity: string
  state: string
}

interface SquareCatalogItem {
  id: string
  item_data?: {
    name?: string
    variations?: Array<{
      id: string
      item_variation_data?: {
        sku?: string
        name?: string
        price_money?: {
          amount: number
          currency: string
        }
      }
    }>
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SQUARE_ACCESS_TOKEN) {
      throw new Error('SQUARE_ACCESS_TOKEN is not configured')
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { action } = await req.json()

    if (action === 'pull') {
      // Pull inventory from Square to local database
      console.log('Pulling inventory from Square...')
      
      // Get catalog items from Square
      const catalogResponse = await fetch('https://connect.squareup.com/v2/catalog/list?types=ITEM', {
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        }
      })

      if (!catalogResponse.ok) {
        const errorText = await catalogResponse.text()
        throw new Error(`Square catalog API error: ${catalogResponse.status} - ${errorText}`)
      }

      const catalogData = await catalogResponse.json()
      const items: SquareCatalogItem[] = catalogData.objects || []

      // Get inventory counts
      const inventoryResponse = await fetch('https://connect.squareup.com/v2/inventory/counts/batch-retrieve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        },
        body: JSON.stringify({
          catalog_object_ids: items.flatMap(item => 
            item.item_data?.variations?.map(v => v.id) || []
          )
        })
      })

      let inventoryCounts: SquareInventoryCount[] = []
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json()
        inventoryCounts = inventoryData.counts || []
      }

      // Create inventory lookup map
      const inventoryMap = new Map<string, number>()
      for (const count of inventoryCounts) {
        if (count.state === 'IN_STOCK') {
          inventoryMap.set(count.catalog_object_id, parseInt(count.quantity) || 0)
        }
      }

      // Upsert products into database
      const productsToUpsert = items.map(item => {
        const variation = item.item_data?.variations?.[0]
        const variantId = variation?.id || item.id
        const inventory = inventoryMap.get(variantId) || 0
        const priceAmount = variation?.item_variation_data?.price_money?.amount || 0

        return {
          id: item.id,
          title: item.item_data?.name || 'Unknown Product',
          item_number: variation?.item_variation_data?.sku || null,
          price: (priceAmount / 100).toFixed(2),
          inventory: inventory,
          status: inventory > 0 ? 'active' : 'out_of_stock',
          updated_at: new Date().toISOString()
        }
      })

      if (productsToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('products')
          .upsert(productsToUpsert, { onConflict: 'id', ignoreDuplicates: false })

        if (upsertError) {
          console.error('Upsert error:', upsertError)
          throw new Error(`Failed to upsert products: ${upsertError.message}`)
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'pull',
        synced: productsToUpsert.length,
        message: `Synced ${productsToUpsert.length} products from Square`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'push') {
      // Push local inventory changes to Square
      console.log('Pushing inventory to Square...')

      // Get all products from database
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, inventory, item_number')
        .not('is_deleted', 'eq', true)

      if (fetchError) {
        throw new Error(`Failed to fetch products: ${fetchError.message}`)
      }

      if (!products || products.length === 0) {
        return new Response(JSON.stringify({ 
          success: true, 
          action: 'push',
          synced: 0,
          message: 'No products to push'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get locations from Square
      const locationsResponse = await fetch('https://connect.squareup.com/v2/locations', {
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        }
      })

      if (!locationsResponse.ok) {
        const errorText = await locationsResponse.text()
        throw new Error(`Square locations API error: ${locationsResponse.status} - ${errorText}`)
      }

      const locationsData = await locationsResponse.json()
      const locationId = locationsData.locations?.[0]?.id

      if (!locationId) {
        throw new Error('No Square location found')
      }

      // Update inventory counts in Square
      const inventoryChanges = products.map((product, index) => ({
        type: 'ADJUSTMENT',
        adjustment: {
          catalog_object_id: product.id,
          location_id: locationId,
          quantity: String(product.inventory),
          from_state: 'NONE',
          to_state: 'IN_STOCK',
          occurred_at: new Date().toISOString()
        }
      }))

      // Square batch limit is 100
      const batches = []
      for (let i = 0; i < inventoryChanges.length; i += 100) {
        batches.push(inventoryChanges.slice(i, i + 100))
      }

      let totalSynced = 0
      for (const batch of batches) {
        const batchResponse = await fetch('https://connect.squareup.com/v2/inventory/changes/batch-create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Square-Version': '2024-01-18'
          },
          body: JSON.stringify({
            idempotency_key: crypto.randomUUID(),
            changes: batch
          })
        })

        if (batchResponse.ok) {
          totalSynced += batch.length
        } else {
          const errorText = await batchResponse.text()
          console.error('Square batch error:', errorText)
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'push',
        synced: totalSynced,
        message: `Pushed ${totalSynced} inventory updates to Square`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      throw new Error('Invalid action. Use "pull" or "push"')
    }

  } catch (error) {
    console.error('Square sync error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
