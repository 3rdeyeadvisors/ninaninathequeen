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
  updated_at?: string  // Square provides this for conflict resolution
  image_ids?: string[]
  item_data?: {
    name?: string
    description?: string
    category_id?: string
    product_type?: string
    image_ids?: string[]
    variations?: Array<{
      id: string
      updated_at?: string
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

interface SquareCatalogImage {
  id: string
  type: 'IMAGE'
  image_data?: {
    url?: string
    caption?: string
  }
}

// Fetch images from Square catalog
async function fetchSquareImages(
  imageIds: string[],
  accessToken: string
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>()
  
  if (imageIds.length === 0) return imageMap

  try {
    // Batch retrieve catalog objects (images)
    const response = await fetch('https://connect.squareup.com/v2/catalog/batch-retrieve', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18'
      },
      body: JSON.stringify({
        object_ids: imageIds,
        include_related_objects: false
      })
    })

    if (response.ok) {
      const data = await response.json()
      const objects = data.objects || []
      
      for (const obj of objects) {
        if (obj.type === 'IMAGE' && obj.image_data?.url) {
          imageMap.set(obj.id, obj.image_data.url)
        }
      }
      console.log(`[SquareSync] Fetched ${imageMap.size} images from Square`)
    } else {
      console.warn('[SquareSync] Failed to fetch images:', await response.text())
    }
  } catch (err) {
    console.error('[SquareSync] Error fetching images:', err)
  }

  return imageMap
}

// Upload image to Square catalog
async function uploadImageToSquare(
  imageUrl: string,
  itemId: string,
  accessToken: string
): Promise<string | null> {
  try {
    // First, fetch the image data
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.warn(`[SquareSync] Could not fetch image: ${imageUrl}`)
      return null
    }

    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()
    
    // Create FormData for multipart upload
    const formData = new FormData()
    
    // Add the image file
    const imageFile = new Blob([imageBuffer], { type: imageBlob.type || 'image/jpeg' })
    formData.append('file', imageFile, 'product-image.jpg')
    
    // Add the request JSON
    const requestJson = {
      idempotency_key: crypto.randomUUID(),
      image: {
        type: 'IMAGE',
        id: `#${crypto.randomUUID()}`,
        image_data: {
          caption: 'Product image'
        }
      },
      object_id: itemId
    }
    formData.append('request', JSON.stringify(requestJson))

    const response = await fetch('https://connect.squareup.com/v2/catalog/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18'
      },
      body: formData
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`[SquareSync] Uploaded image for item ${itemId}:`, data.image?.id)
      return data.image?.id || null
    } else {
      const errorText = await response.text()
      console.warn(`[SquareSync] Failed to upload image for ${itemId}:`, errorText)
      return null
    }
  } catch (err) {
    console.error(`[SquareSync] Error uploading image for ${itemId}:`, err)
    return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - no authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN');

    // Validate the user's JWT token
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.error('[SquareSync] Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role using the has_role function
    const { data: isAdmin, error: roleError } = await userClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) {
      console.error('[SquareSync] Role check error:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.warn('[SquareSync] Access denied for user:', user.email);
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body - apiKey from client is only used as fallback if env var is not set
    const { action, apiKey } = await req.json()
    
    // Prefer environment variable over client-provided key for security
    const FINAL_SQUARE_TOKEN = SQUARE_ACCESS_TOKEN || apiKey

    if (!FINAL_SQUARE_TOKEN) {
      throw new Error('Square Access Token is not configured. Please provide it in settings.')
    }

    // Create service role client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log(`[SquareSync] User ${user.email} initiated ${action} action`);

    if (action === 'pull') {
      // Pull inventory from Square to local database
      console.log('[SquareSync] Starting PULL from Square...')
      
      // Get catalog items from Square (include IMAGE type to get image objects)
      const catalogResponse = await fetch('https://connect.squareup.com/v2/catalog/list?types=ITEM,IMAGE', {
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
      const allObjects = catalogData.objects || []
      
      // Separate items and images
      const items: SquareCatalogItem[] = allObjects.filter((obj: { type: string }) => obj.type === 'ITEM')
      const images: SquareCatalogImage[] = allObjects.filter((obj: { type: string }) => obj.type === 'IMAGE')
      
      // Build image lookup map
      const imageUrlMap = new Map<string, string>()
      for (const img of images) {
        if (img.image_data?.url) {
          imageUrlMap.set(img.id, img.image_data.url)
        }
      }
      
      console.log('[SquareSync] Found items from Square:', items.length, 'Images:', images.length)

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

      // Collect all image IDs that weren't in the catalog response
      const missingImageIds: string[] = []
      for (const item of items) {
        const itemImageIds = item.item_data?.image_ids || item.image_ids || []
        for (const imageId of itemImageIds) {
          if (!imageUrlMap.has(imageId)) {
            missingImageIds.push(imageId)
          }
        }
      }

      // Fetch any missing images
      if (missingImageIds.length > 0) {
        const additionalImages = await fetchSquareImages(missingImageIds, FINAL_SQUARE_TOKEN)
        for (const [id, url] of additionalImages) {
          imageUrlMap.set(id, url)
        }
      }

      console.log('[SquareSync] Total images available:', imageUrlMap.size)

      // Log each item for debugging
      items.forEach((item, index) => {
        const imageIds = item.item_data?.image_ids || item.image_ids || []
        console.log(`[SquareSync] Item ${index + 1}:`, {
          id: item.id,
          name: item.item_data?.name,
          type: item.type,
          variations: item.item_data?.variations?.length || 0,
          imageIds: imageIds.length
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

      // Fetch existing local products to compare timestamps
      const squareItemIds = items.map(item => item.id)
      const { data: localProducts } = await supabase
        .from('products')
        .select('id, updated_at, inventory')
        .in('id', squareItemIds)

      const localProductMap = new Map<string, { updated_at: string; inventory: number }>()
      for (const lp of localProducts || []) {
        localProductMap.set(lp.id, { updated_at: lp.updated_at, inventory: lp.inventory })
      }

      console.log('[SquareSync] Local products found for comparison:', localProductMap.size)

      // Build products to upsert, comparing timestamps for conflict resolution
      const productsToUpsert: Record<string, unknown>[] = []
      const skippedCount = 0

      for (const item of items) {
        const variation = item.item_data?.variations?.[0]
        const variantId = variation?.id || item.id
        const squareInventory = inventoryMap.get(variantId) || 0
        const priceAmount = variation?.item_variation_data?.price_money?.amount || 0
        const name = item.item_data?.name || 'Unknown Product'
        
        // Get Square's updated_at timestamp
        const squareUpdatedAt = item.updated_at || variation?.updated_at
        const localProduct = localProductMap.get(item.id)
        
        // Timestamp-based conflict resolution
        const shouldUpdateFromSquare = true
        let finalInventory = squareInventory
        
        if (localProduct && squareUpdatedAt) {
          const squareTime = new Date(squareUpdatedAt).getTime()
          const localTime = new Date(localProduct.updated_at).getTime()
          
          if (localTime > squareTime) {
            // Local is newer - keep local inventory, but still update other fields from Square
            finalInventory = localProduct.inventory
            console.log(`[SquareSync] ${name}: Local is newer (${localProduct.updated_at} > ${squareUpdatedAt}), keeping local inventory: ${finalInventory}`)
          } else {
            console.log(`[SquareSync] ${name}: Square is newer, using Square inventory: ${finalInventory}`)
          }
        }
        
        // Get the first image URL for this item
        const itemImageIds = item.item_data?.image_ids || item.image_ids || []
        const imageUrl = itemImageIds.length > 0 ? imageUrlMap.get(itemImageIds[0]) : null
        
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

        const product: Record<string, unknown> = {
          id: item.id,
          title: name,
          description: item.item_data?.description || `${name} from Square catalog`,
          item_number: variation?.item_variation_data?.sku || null,
          price: (priceAmount / 100).toFixed(2),
          inventory: finalInventory,
          status: 'Active',
          product_type: productType,
          category: productType,
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          is_deleted: false,
          updated_at: new Date().toISOString()
        }

        // Only set image if we have one from Square
        if (imageUrl) {
          product.image = imageUrl
          console.log(`[SquareSync] Product ${name} has image: ${imageUrl.substring(0, 50)}...`)
        }

        console.log('[SquareSync] Mapped product:', name, '- Price:', product.price, '- Inventory:', product.inventory, '- Has Image:', !!imageUrl)
        
        productsToUpsert.push(product)
      }

      console.log('[SquareSync] Products to upsert:', productsToUpsert.length, 'Skipped (local newer):', skippedCount)

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

      const productsWithImages = productsToUpsert.filter(p => p.image).length

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'pull',
        synced: productsToUpsert.length,
        imagesFound: productsWithImages,
        message: `Synced ${productsToUpsert.length} products from Square (${productsWithImages} with images)`,
        products: productsToUpsert.map(p => ({ id: p.id, title: p.title, price: p.price, hasImage: !!p.image }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'push') {
      // Push local inventory changes to Square
      console.log('[SquareSync] Starting PUSH to Square...')

      // Get all products from database (now including image)
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, title, inventory, item_number, image')
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

      // Fetch Square Catalog to establish mapping (ID or SKU) and check existing images
      const catalogResponse = await fetch('https://connect.squareup.com/v2/catalog/list?types=ITEM', {
        headers: {
          'Authorization': `Bearer ${FINAL_SQUARE_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        }
      })

      let squareCatalog: SquareCatalogItem[] = []
      const squareItemImages = new Map<string, string[]>() // itemId -> imageIds
      
      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json()
        squareCatalog = catalogData.objects || []
        console.log('[SquareSync] PUSH: Square catalog fetched for mapping, items:', squareCatalog.length)
        
        // Track existing images per item
        for (const item of squareCatalog) {
          const imageIds = item.item_data?.image_ids || item.image_ids || []
          if (imageIds.length > 0) {
            squareItemImages.set(item.id, imageIds)
          }
        }
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

      // Upload images for products that have images but Square doesn't have them yet
      let imagesUploaded = 0
      for (const product of products) {
        const squareItemId = squareMapping.get(product.id)
        if (!squareItemId) continue
        
        // Check if product has an image and Square item doesn't have images
        const existingImages = squareItemImages.get(squareItemId) || []
        if (product.image && existingImages.length === 0) {
          // Only upload if the image is a URL (not already a Square URL)
          if (product.image.startsWith('http') && !product.image.includes('squarecdn.com')) {
            console.log(`[SquareSync] Uploading image for ${product.title}...`)
            const imageId = await uploadImageToSquare(product.image, squareItemId, FINAL_SQUARE_TOKEN)
            if (imageId) {
              imagesUploaded++
            }
          }
        }
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
        imagesUploaded: imagesUploaded,
        totalAttempted: products.length,
        mappedCount: inventoryChanges.length,
        message: `Pushed ${totalSynced} inventory updates to Square${imagesUploaded > 0 ? ` (${imagesUploaded} images uploaded)` : ''}`
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
