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

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No products provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare products for upsert
    const rows: ProductData[] = products.map((p: ProductData) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      inventory: p.inventory,
      size_inventory: p.size_inventory || {},
      image: p.image,
      description: p.description,
      product_type: p.product_type,
      collection: p.collection,
      category: p.category,
      status: p.status,
      item_number: p.item_number,
      color_codes: p.color_codes,
      sizes: p.sizes,
      is_deleted: false,
    }));

    console.log('[sync-products] Upserting', rows.length, 'products');

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

    console.log('[sync-products] Success! Upserted', data?.length || 0, 'products');

    return new Response(
      JSON.stringify({ success: true, count: data?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[sync-products] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});