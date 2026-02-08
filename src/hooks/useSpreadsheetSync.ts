import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { parseSpreadsheet } from '@/lib/spreadsheet';
import { useProducts } from '@/hooks/useProducts';
import { PRODUCT_SIZES } from '@/lib/constants';
import { getSupabase } from '@/lib/supabaseClient';

// Upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 1000;

// Parse color codes from spreadsheet (comma-separated hex values or names)
const parseColors = (colorStr: string): string[] => {
  if (!colorStr) return [];
  return colorStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
};

// Normalize title to handle inconsistencies like "One Piece" vs "One-Piece"
const normalizeTitle = (title: string): string => {
  return title
    .replace(/one piece/gi, 'One-Piece')  // Standardize "One Piece" → "One-Piece"
    .replace(/\s+/g, ' ')                   // Collapse multiple spaces
    .trim();
};

export function useSpreadsheetSync() {
  const { data: allProducts } = useProducts(1000);
  const { updateProductOverride } = useAdminStore();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Separate spreadsheet and images
    const fileList = Array.from(files);
    const spreadsheetFile = fileList.find(f =>
      f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    const imageFiles = fileList.filter(f => f.type.startsWith('image/'));

    if (!spreadsheetFile) {
      toast.error("No valid spreadsheet file (.csv, .xlsx, .xls) found.");
      setIsUploading(false);
      return;
    }

    // Validate file size
    if (spreadsheetFile.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum ${MAX_FILE_SIZE / (1024 * 1024)}MB allowed.`);
      setIsUploading(false);
      return;
    }

    toast.info(`Analyzing ${spreadsheetFile.name}...`);
    console.log('[SpreadsheetSync] Starting file upload:', spreadsheetFile.name);

    // Process images into a map of filenames to data URLs
    const imageMap: Record<string, string> = {};
    await Promise.all(imageFiles.map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          imageMap[file.name] = event.target?.result as string;
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }));

    console.log('[SpreadsheetSync] Loaded images:', Object.keys(imageMap).length);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as ArrayBuffer;
        const rows = parseSpreadsheet(data);
        
        console.log('[SpreadsheetSync] Parsed rows:', rows.length);
        console.log('[SpreadsheetSync] Sample row:', rows[0]);
        
        // Validate row count
        if (rows.length > MAX_ROWS) {
          toast.error(`Too many rows (${rows.length}). Maximum ${MAX_ROWS} allowed.`);
          setIsUploading(false);
          return;
        }

        if (rows.length === 0) {
          toast.error("No data rows found in spreadsheet.");
          setIsUploading(false);
          return;
        }

        // Group rows by base product name (extract size from title like "White Top (XS)")
        const productGroups: Record<string, {
          baseTitle: string;
          id: string;
          price: string;
          productType: string;
          collection: string;
          status: string;
          sizeInventory: Record<string, number>;
          image?: string;
          description?: string;
          itemNumber?: string;
          colorCodes?: string[];
        }> = {};

        rows.forEach((row, index) => {
          const title = row.title ? String(row.title) : '';
          if (!title) {
            console.log(`[SpreadsheetSync] Row ${index} skipped - no title`);
            return;
          }

          // Normalize title to handle inconsistencies
          const normalizedTitle = normalizeTitle(title);

          // Extract size from title like "White Top (XS)" or "One-Piece (2XL)"
          const sizeMatch = normalizedTitle.match(/\(([^)]+)\)$/);
          const size = sizeMatch ? sizeMatch[1].toUpperCase() : null;
          const baseTitle = sizeMatch 
            ? normalizedTitle.replace(/\s*\([^)]+\)$/, '').trim() 
            : normalizedTitle;
          
          // Group by normalized base title only (not collection) to prevent incorrect merging
          const groupKey = baseTitle;
          
          if (!productGroups[groupKey]) {
            productGroups[groupKey] = {
              baseTitle,
              id: row.id ? String(row.id) : `sync-${Object.keys(productGroups).length}`,
              price: row.price ? String(row.price).replace(/[^0-9.]/g, '') : '0.00',
              productType: row.producttype || 'Bikini',
              collection: row.collection || '',
              status: row.status || 'Active',
              sizeInventory: {},
              image: row.image,
              description: row.description,
              itemNumber: row.itemnumber,
              colorCodes: row.colors ? parseColors(String(row.colors)) : undefined
            };
          }

          // Add size inventory
          if (size) {
            const stock = row.inventory !== undefined ? parseInt(row.inventory) || 0 : 0;
            productGroups[groupKey].sizeInventory[size] = 
              (productGroups[groupKey].sizeInventory[size] || 0) + stock;
          } else {
            // No size in title - treat as a product without size variants (e.g., "Black One-Piece Plus")
            // Store total inventory under a special key
            const stock = row.inventory !== undefined ? parseInt(row.inventory) || 0 : 0;
            productGroups[groupKey].sizeInventory['ONE_SIZE'] = 
              (productGroups[groupKey].sizeInventory['ONE_SIZE'] || 0) + stock;
          }
        });

        console.log('[SpreadsheetSync] Product groups created:', Object.keys(productGroups).length);

        let updatedCount = 0;
        const productsToSync: ProductOverride[] = [];

        Object.values(productGroups).forEach((product) => {
          // Generate consistent ID based on normalized title to prevent duplicates
          const normalizedId = product.baseTitle.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          // Find existing product for matching
          let existingProduct = allProducts?.find(p =>
            p.id === product.id ||
            p.id === `product-${product.id}` ||
            p.id === `sync-${normalizedId}` ||
            p.title.toLowerCase() === product.baseTitle.toLowerCase()
          );

          // Use consistent ID generation for new products
          const id = existingProduct
            ? existingProduct.id
            : `sync-${normalizedId}`;

          // Get sizes from inventory or use defaults
          // Filter out ONE_SIZE if we have other sizes
          const inventorySizes = Object.keys(product.sizeInventory);
          const hasRealSizes = inventorySizes.some(s => s !== 'ONE_SIZE');
          const sizes = hasRealSizes
            ? inventorySizes.filter(s => s !== 'ONE_SIZE')
            : inventorySizes.length > 0
              ? inventorySizes
              : [...PRODUCT_SIZES];

          // Calculate total inventory
          const totalInventory = Object.values(product.sizeInventory).reduce((sum, qty) => sum + qty, 0);

          // Handle Image
          let image = existingProduct?.images[0]?.url ||
            "https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=800";
          if (product.image) {
            if (imageMap[product.image]) {
              image = imageMap[product.image];
            } else if (product.image.startsWith('http')) {
              image = product.image;
            }
          }

          // Use Type column directly as category (no auto-detection needed)
          const category = product.productType || 'Other';

          const productOverride: ProductOverride = {
            id,
            title: product.baseTitle,
            price: product.price,
            inventory: totalInventory,
            sizes: sizes,
            sizeInventory: product.sizeInventory,
            image: image,
            description: product.description || existingProduct?.description ||
              `Luxury ${product.productType.toLowerCase()} from the ${product.collection || 'Nina Armend'} collection.`,
            productType: product.productType,
            collection: product.collection,
            category: category,
            status: product.status as 'Active' | 'Inactive' | 'Draft',
            itemNumber: product.itemNumber,
            colorCodes: product.colorCodes
          };

          // Update local store
          updateProductOverride(id, productOverride);
          productsToSync.push(productOverride);
          updatedCount++;
        });

        console.log('[SpreadsheetSync] Products to sync to database:', productsToSync.length);

        // Sync all products to database
        const syncToDb = async () => {
          try {
            const supabase = getSupabase();
            const rows = productsToSync.map(p => ({
              id: p.id,
              title: p.title,
              price: p.price,
              inventory: p.inventory,
              size_inventory: p.sizeInventory || {},
              image: p.image,
              description: p.description,
              product_type: p.productType,
              collection: p.collection,
              category: p.category,
              status: p.status,
              item_number: p.itemNumber,
              color_codes: p.colorCodes,
              sizes: p.sizes,
              is_deleted: false,
            }));

            console.log('[SpreadsheetSync] Upserting to database:', rows.length, 'products');
            console.log('[SpreadsheetSync] Sample product:', JSON.stringify(rows[0], null, 2));

            const { data, error } = await supabase
              .from('products')
              .upsert(rows, { onConflict: 'id' })
              .select();

            if (error) {
              console.error('[SpreadsheetSync] Database error:', JSON.stringify(error, null, 2));
              toast.error(`Database sync failed: ${error.message}`);
            } else {
              console.log('[SpreadsheetSync] Database success! Upserted:', data?.length || 0, 'products');
              toast.success(`Sync complete! ${updatedCount} products saved to database.`);
            }
          } catch (err) {
            console.error('[SpreadsheetSync] Database sync exception:', err);
            toast.error('Database sync failed. Check console for details.');
          }
          setIsUploading(false);
        };

        syncToDb();
      } catch (error) {
        console.error('[SpreadsheetSync] Spreadsheet parsing failed:', error);
        setIsUploading(false);
        toast.error("Failed to parse spreadsheet. Please ensure it's a valid CSV or Excel file.");
      }
    };
    reader.readAsArrayBuffer(spreadsheetFile);
  };

  const downloadTemplate = () => {
    const csvContent = `Item ID,Item Name,Type,Price Per Unit,Stock,Collection,Status,Item Number,Color
LB-001,White Top (XS),Top,85.00,10,La Bella,Active,SKU-001,#FFFFFF
LB-002,White Top (S),Top,85.00,15,La Bella,Active,SKU-001,#FFFFFF
LB-003,White Bottom (XS),Bottom,75.00,8,La Bella,Active,SKU-002,#FFD700
EM-001,Black One-Piece (M),One-Piece,120.00,5,El Mar,Active,SKU-003,#000000
TB-001,Sunset Set (S),Top & Bottom,150.00,12,Summer,Active,SKU-004,"#FF6B35,#FFD700"
`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nina_armend_inventory_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Template downloaded!");
  };

  return {
    isUploading,
    handleFileUpload,
    downloadTemplate,
    fileInputRef
  };
}
