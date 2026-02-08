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
    const rows = productList.map((p: any) => ({
      id: p.id,
      title: p.title || '',
      price: p.price || '0.00',
      inventory: p.inventory !== undefined ? p.inventory : 0,
      size_inventory: p.size_inventory || p.sizeInventory || {},
      image: p.image || '',
      description: p.description || '',
      product_type: p.product_type || p.productType || 'Other',
      collection: p.collection || '',
      category: p.category || 'Other',
      status: p.status || 'Active',
      item_number: p.item_number || p.itemNumber || null,
      color_codes: p.color_codes || p.colorCodes || [],
      sizes: p.sizes || [],
      is_deleted: p.is_deleted !== undefined ? p.is_deleted : (p.isDeleted !== undefined ? p.isDeleted : false),
    }));

    console.log(`[sync-products] Upserting ${rows.length} products`);

    const { data, error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'id' })
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