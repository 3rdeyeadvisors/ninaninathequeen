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
  type: string
  item_data?: {
    name?: string
    description?: string
    category_id?: string
    product_type?: string
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

    const { action, apiKey } = await req.json()
    const FINAL_SQUARE_TOKEN = apiKey || SQUARE_ACCESS_TOKEN

    if (!FINAL_SQUARE_TOKEN) {
      throw new Error('Square Access Token is not configured. Please provide it in settings.')
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (action === 'pull') {
      // Pull inventory from Square to local database
      console.log('[SquareSync] Starting PULL from Square...')
      
      // Get catalog items from Square
      const catalogResponse = await fetch('https://connect.squareup.com/v2/catalog/list?types=ITEM', {
        headers: {
          'Authorization': `Bearer ${FINAL_SQUARE_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        }
      })

      if (!catalogResponse.ok) {
        const errorText = await catalogResponse.text()
        console.error('[SquareSync] Square catalog API error:', catalogResponse.status, errorText)
        throw new Error(`Square catalog API error: ${catalogResponse.status} - ${errorText}`)
      }

      const catalogData = await catalogResponse.json()
      const items: SquareCatalogItem[] = catalogData.objects || []
      
      console.log('[SquareSync] Raw catalog response:', JSON.stringify(catalogData, null, 2))
      console.log('[SquareSync] Found items from Square:', items.length)

      if (items.length === 0) {
        return new Response(JSON.stringify({ 
          success: true, 
          action: 'pull',
          synced: 0,
          message: 'No items found in Square catalog. Make sure you have products in your Square account.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Log each item for debugging
      items.forEach((item, index) => {
        console.log(`[SquareSync] Item ${index + 1}:`, {
          id: item.id,
          name: item.item_data?.name,
          type: item.type,
          variations: item.item_data?.variations?.length || 0
        })
      })

      // Get all variation IDs
      const variationIds = items.flatMap(item => 
        item.item_data?.variations?.map(v => v.id) || []
      )

      console.log('[SquareSync] Variation IDs to fetch inventory for:', variationIds.length)

      // Get inventory counts (only if we have variations)
      let inventoryCounts: SquareInventoryCount[] = []
      if (variationIds.length > 0) {
        const inventoryResponse = await fetch('https://connect.squareup.com/v2/inventory/counts/batch-retrieve', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FINAL_SQUARE_TOKEN}`,
            'Content-Type': 'application/json',
            'Square-Version': '2024-01-18'
          },
          body: JSON.stringify({
            catalog_object_ids: variationIds
          })
        })

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json()
          inventoryCounts = inventoryData.counts || []
          console.log('[SquareSync] Inventory counts retrieved:', inventoryCounts.length)
        } else {
          console.warn('[SquareSync] Could not fetch inventory counts:', await inventoryResponse.text())
        }
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
        const name = item.item_data?.name || 'Unknown Product'
        
        // Extract product type from name or use default
        let productType = 'Other'
        const nameLower = name.toLowerCase()
        if (nameLower.includes('top') || nameLower.includes('bikini top')) {
          productType = 'Top'
        } else if (nameLower.includes('bottom') || nameLower.includes('bikini bottom')) {
          productType = 'Bottom'
        } else if (nameLower.includes('one-piece') || nameLower.includes('one piece') || nameLower.includes('swimsuit')) {
          productType = 'One-Piece'
        } else if (nameLower.includes('cover') || nameLower.includes('sarong') || nameLower.includes('wrap')) {
          productType = 'Cover-up'
        }

        const product = {
          id: item.id,
          title: name,
          description: item.item_data?.description || `${name} from Square catalog`,
          item_number: variation?.item_variation_data?.sku || null,
          price: (priceAmount / 100).toFixed(2),
          inventory: inventory,
          status: 'Active',
          product_type: productType,
          category: productType,
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          is_deleted: false,
          updated_at: new Date().toISOString()
        }

        console.log('[SquareSync] Mapped product:', product.title, '- Price:', product.price, '- Inventory:', product.inventory)
        
        return product
      })

      console.log('[SquareSync] Products to upsert:', productsToUpsert.length)

      if (productsToUpsert.length > 0) {
        const { data, error: upsertError } = await supabase
          .from('products')
          .upsert(productsToUpsert, { onConflict: 'id', ignoreDuplicates: false })
          .select()

        if (upsertError) {
          console.error('[SquareSync] Upsert error:', JSON.stringify(upsertError, null, 2))
          throw new Error(`Failed to upsert products: ${upsertError.message}`)
        }

        console.log('[SquareSync] Successfully upserted products:', data?.length || 0)
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'pull',
        synced: productsToUpsert.length,
        message: `Synced ${productsToUpsert.length} products from Square`,
        products: productsToUpsert.map(p => ({ id: p.id, title: p.title, price: p.price }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'push') {
      // Push local inventory changes to Square
      console.log('[SquareSync] Starting PUSH to Square...')

      // Get all products from database
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, title, inventory, item_number')
        .not('is_deleted', 'eq', true)

      if (fetchError) {
        console.error('[SquareSync] Fetch error:', fetchError)
        throw new Error(`Failed to fetch products: ${fetchError.message}`)
      }

      console.log('[SquareSync] Products fetched from database:', products?.length || 0)

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

      // Fetch Square Catalog to establish mapping (ID or SKU)
      const catalogResponse = await fetch('https://connect.squareup.com/v2/catalog/list?types=ITEM', {
        headers: {
          'Authorization': `Bearer ${FINAL_SQUARE_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        }
      })

      let squareCatalog: SquareCatalogItem[] = []
      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json()
        squareCatalog = catalogData.objects || []
        console.log('[SquareSync] PUSH: Square catalog fetched for mapping, items:', squareCatalog.length)
      } else {
        console.warn('[SquareSync] PUSH: Could not fetch Square catalog for mapping, proceeding with raw IDs')
      }

      // Create mapping from SKU -> Square ID and Square ID -> Square ID
      const squareMapping = new Map<string, string>()
      for (const item of squareCatalog) {
        // Map by ID
        squareMapping.set(item.id, item.id)

        // Map by SKU (if variation exists)
        const variations = item.item_data?.variations || []
        for (const v of variations) {
          squareMapping.set(v.id, v.id)
          if (v.item_variation_data?.sku) {
            squareMapping.set(v.item_variation_data.sku, v.id)
          }
        }
      }

      // Get locations from Square
      const locationsResponse = await fetch('https://connect.squareup.com/v2/locations', {
        headers: {
          'Authorization': `Bearer ${FINAL_SQUARE_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        }
      })

      if (!locationsResponse.ok) {
        const errorText = await locationsResponse.text()
        console.error('[SquareSync] Locations API error:', locationsResponse.status, errorText)
        throw new Error(`Square locations API error: ${locationsResponse.status} - ${errorText}`)
      }

      const locationsData = await locationsResponse.json()
      const locationId = locationsData.locations?.[0]?.id

      if (!locationId) {
        throw new Error('No Square location found')
      }

      // Update inventory counts in Square using the mapping
      const inventoryChanges = products
        .map((product) => {
          // Try to find Square ID via mapping (either by product ID or SKU/item_number)
          const squareId = squareMapping.get(product.id) ||
                          (product.item_number ? squareMapping.get(product.item_number) : null);

          if (!squareId) {
            console.warn(`[SquareSync] No Square mapping found for product: ${product.title} (ID: ${product.id}, SKU: ${product.item_number})`);
            return null;
          }

          return {
            type: 'ADJUSTMENT',
            adjustment: {
              catalog_object_id: squareId,
              location_id: locationId,
              quantity: String(product.inventory || 0),
              from_state: 'NONE',
              to_state: 'IN_STOCK',
              occurred_at: new Date().toISOString()
            }
          }
        })
        .filter(change => change !== null);

      console.log(`[SquareSync] Mapped ${inventoryChanges.length} products to Square catalog objects`);

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
            'Authorization': `Bearer ${FINAL_SQUARE_TOKEN}`,
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
          console.error('[SquareSync] Square batch error:', errorText)
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'push',
        synced: totalSynced,
        totalAttempted: products.length,
        mappedCount: inventoryChanges.length,
        message: `Pushed ${totalSynced} inventory updates to Square (from ${products.length} products total)`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      throw new Error('Invalid action. Use "pull" or "push"')
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[SquareSync] Error:', errorMessage)
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
