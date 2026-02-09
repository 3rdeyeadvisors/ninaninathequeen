import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  id: string;
  title: string;
  price: string;
  inventory: number;
  size_inventory: Record<string, number>;
  image: string;
  description: string;
  product_type: string;
  collection: string;
  category: string;
  status: string;
  item_number?: string;
  color_codes?: string[];
  sizes: string[];
  is_deleted: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { products, adminEmail } = await req.json();

    // Validate admin email (simple check - in production use proper auth)
    const ADMIN_EMAIL = 'lydia@ninaarmend.co.site';
    if (adminEmail?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!products) {
      return new Response(
        JSON.stringify({ error: 'No products provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productList = Array.isArray(products) ? products : [products];

    if (productList.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare products for upsert
    const rows = productList.map((p: any) => {
      // Ensure ID is a string and not empty
      const id = String(p.id || '').trim();
      if (!id) {
        console.error('[sync-products] Missing ID for product:', p.title);
      }

      // Normalize size_inventory to ensure it's a valid object
      let sizeInventory = p.size_inventory || p.sizeInventory || {};
      if (typeof sizeInventory === 'string') {
        try {
          sizeInventory = JSON.parse(sizeInventory);
        } catch (e) {
          console.error('[sync-products] Failed to parse size_inventory for:', id);
          sizeInventory = {};
        }
      }

      return {
        id,
        title: String(p.title || '').trim(),
        price: String(p.price || '0.00'),
        inventory: Number(p.inventory) || 0,
        size_inventory: sizeInventory,
        image: String(p.image || ''),
        description: String(p.description || ''),
        product_type: String(p.product_type || p.productType || 'Other'),
        collection: String(p.collection || ''),
        category: String(p.category || p.productType || 'Other'),
        status: String(p.status || 'Active'),
        item_number: p.item_number || p.itemNumber || null,
        color_codes: Array.isArray(p.color_codes || p.colorCodes) ? (p.color_codes || p.colorCodes) : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        is_deleted: Boolean(p.is_deleted ?? p.isDeleted ?? false),
        updated_at: new Date().toISOString()
      };
    }).filter(row => row.id); // Remove rows with missing IDs

    // Deduplicate rows by ID to prevent Postgres upsert collisions
    const uniqueRows = rows.filter((row: any, index: number, self: any[]) =>
      index === self.findIndex((r) => r.id === row.id)
    );

    console.log(`[sync-products] Upserting ${uniqueRows.length} products (deduplicated from ${rows.length})`);

    const { data, error } = await supabase
      .from('products')
      .upsert(uniqueRows, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('[sync-products] Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, count: data?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[sync-products] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});