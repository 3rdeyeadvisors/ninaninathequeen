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

// Auto-sync inventory changes to Square
async function syncToSquare(
  supabaseUrl: string,
  authHeader: string,
  updatedProducts: any[]
): Promise<void> {
  try {
    // Call the Square sync edge function to push changes
    const response = await fetch(`${supabaseUrl}/functions/v1/square-sync-inventory`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'push',
        products: updatedProducts,
        uploadImages: false
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[sync-products] Auto-synced to Square:', result.message);
    } else {
      const errorText = await response.text();
      console.warn('[sync-products] Square auto-sync failed:', errorText);
    }
  } catch (err) {
    console.error('[sync-products] Square auto-sync error:', err);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's JWT to validate their session
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Validate the user's JWT token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.error('[sync-products] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role using the has_role function
    const { data: isAdmin, error: roleError } = await userClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) {
      console.error('[sync-products] Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.warn('[sync-products] Access denied for user:', user.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { products } = await req.json();

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

    // Create service role client for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare products for upsert
    const rows = productList.map((p: Record<string, unknown>) => {
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
        status: (() => {
          // Normalize status to match database constraints (Active, Inactive, Draft)
          const rawStatus = String(p.status || 'Active');
          if (['Active', 'Inactive', 'Draft'].includes(rawStatus)) {
            return rawStatus;
          }
          const statusLower = rawStatus.toLowerCase();
          if (statusLower.includes('active') || statusLower.includes('stock') || statusLower.includes('order')) {
            return 'Active';
          } else if (statusLower.includes('draft')) {
            return 'Draft';
          }
          return 'Inactive';
        })(),
        item_number: p.item_number || p.itemNumber || null,
        color_codes: Array.isArray(p.color_codes || p.colorCodes) ? (p.color_codes || p.colorCodes) : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        is_deleted: Boolean(p.is_deleted ?? p.isDeleted ?? false),
        updated_at: new Date().toISOString()
      };
    }).filter(row => row.id); // Remove rows with missing IDs

    // Deduplicate rows by ID to prevent Postgres upsert collisions
    const uniqueRows = rows.filter((row: Record<string, unknown>, index: number, self: Record<string, unknown>[]) =>
      index === self.findIndex((r) => r.id === row.id)
    );

    console.log(`[sync-products] User ${user.email} upserting ${uniqueRows.length} products (deduplicated from ${rows.length})`);

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

    // Check if auto-sync to Square is enabled
    const { data: settingsData } = await supabase
      .from('store_settings')
      .select('auto_sync, pos_provider')
      .limit(1)
      .maybeSingle();

    const autoSyncEnabled = settingsData?.auto_sync ?? false;
    const posProvider = settingsData?.pos_provider;

    // Auto-sync to Square if enabled
    if (autoSyncEnabled && posProvider === 'square') {
      console.log('[sync-products] Auto-sync enabled, pushing to Square...');
      // Don't await - let it run in background to not slow down the response
      syncToSquare(supabaseUrl, authHeader, uniqueRows).catch(err =>
        console.error('[sync-products] Background Square sync failed:', err)
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data?.length || 0,
        products: data,
        autoSynced: autoSyncEnabled && posProvider === 'square'
      }),
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
