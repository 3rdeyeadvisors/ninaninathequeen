import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { parseSpreadsheet } from '@/lib/spreadsheet';
import { useProducts } from '@/hooks/useProducts';
import { PRODUCT_SIZES } from '@/lib/constants';
import { useProductsDb } from '@/hooks/useProductsDb';

// Upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 1000;

// Parse color codes from spreadsheet (comma-separated hex values or names)
const parseColors = (colorStr: string): string[] => {
  if (!colorStr) return [];
  return colorStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
};

// Normalize title to handle inconsistencies
const normalizeTitle = (title: string): string => {
  return title
    .replace(/one piece/gi, 'One-Piece')
    .replace(/\s+/g, ' ')
    .trim();
};

export function useSpreadsheetSync() {
  const { data: allProducts } = useProducts(1000);
  const { updateProductOverride } = useAdminStore();
  const { bulkUpsertProducts, fetchProducts } = useProductsDb();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

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

    if (spreadsheetFile.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum ${MAX_FILE_SIZE / (1024 * 1024)}MB allowed.`);
      setIsUploading(false);
      return;
    }

    toast.info(`Analyzing ${spreadsheetFile.name}...`);

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

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result as ArrayBuffer;
        const rows = parseSpreadsheet(data);
        
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

        rows.forEach((row) => {
          const title = row.title ? String(row.title) : '';
          if (!title) return;

          const normalizedTitle = normalizeTitle(title);
          const sizeMatch = normalizedTitle.match(/\(([^)]+)\)$/);
          const titleSize = sizeMatch ? sizeMatch[1].toUpperCase() : null;
          const baseTitle = sizeMatch 
            ? normalizedTitle.replace(/\s*\([^)]+\)$/, '').trim() 
            : normalizedTitle;
          
          // Use size from dedicated column if available, otherwise from title
          const size = (row.size ? String(row.size).toUpperCase().trim() : titleSize) || 'ONE_SIZE';

          const collection = row.collection || '';
          // Group by ID if available, otherwise by Title + Collection
          const groupKey = row.id ? String(row.id) : `${baseTitle}-${collection}`;
          
          if (!productGroups[groupKey]) {
            const slug = baseTitle.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');

            productGroups[groupKey] = {
              baseTitle,
              id: row.id ? String(row.id) : `sync-${slug || Math.random().toString(36).substring(7)}`,
              price: row.price ? String(row.price).replace(/[^0-9.]/g, '') : '0.00',
              productType: row.producttype || '',
              collection: collection,
              status: row.status || 'Active',
              sizeInventory: {},
              image: row.image,
              description: row.description,
              itemNumber: row.itemnumber,
              colorCodes: row.colors ? parseColors(String(row.colors)) : undefined
            };
          }

          const stock = row.inventory !== undefined ? parseInt(row.inventory) || 0 : 0;
          productGroups[groupKey].sizeInventory[size] =
            (productGroups[groupKey].sizeInventory[size] || 0) + stock;
        });

        const productsToSync: ProductOverride[] = [];

        Object.values(productGroups).forEach((product) => {
          const normalizedSlug = product.baseTitle.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          const existingProduct = allProducts?.find(p =>
            p.id === product.id ||
            p.id === `sync-${normalizedSlug}` ||
            (p.title.toLowerCase() === product.baseTitle.toLowerCase() &&
             (allProducts.length < 50)) // Only match by title if catalog is small to avoid false positives
          );

          // Use existing product ID if found, otherwise use spreadsheet ID
          // We no longer force sync- prefix if a specific ID was provided in the spreadsheet
          const id = existingProduct ? existingProduct.id : product.id;

          const inventorySizes = Object.keys(product.sizeInventory);
          const hasRealSizes = inventorySizes.some(s => s !== 'ONE_SIZE');
          const sizes = hasRealSizes
            ? inventorySizes.filter(s => s !== 'ONE_SIZE')
            : inventorySizes.length > 0
              ? inventorySizes
              : [...PRODUCT_SIZES];

          const totalInventory = Object.values(product.sizeInventory).reduce((sum, qty) => sum + qty, 0);

          let image = existingProduct?.images[0]?.url ||
            "https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=800";

          if (product.image) {
            if (imageMap[product.image]) {
              image = imageMap[product.image];
            } else if (product.image.startsWith('http')) {
              image = product.image;
            }
          }

          // Normalize status to match database constraints
          let status = product.status || 'Active';
          if (!['Active', 'Inactive', 'Draft'].includes(status)) {
            const statusLower = status.toLowerCase();
            if (statusLower.includes('active') || statusLower.includes('stock') || statusLower.includes('order')) {
              status = 'Active';
            } else if (statusLower.includes('draft')) {
              status = 'Draft';
            } else {
              status = 'Inactive';
            }
          }

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
            category: product.productType,
            status: status as 'Active' | 'Inactive' | 'Draft',
            itemNumber: product.itemNumber,
            colorCodes: product.colorCodes
          };

          updateProductOverride(id, productOverride);
          productsToSync.push(productOverride);
        });

        // Deduplicate products to sync by ID to prevent database upsert collisions
        const uniqueProductsToSync = productsToSync.filter((product, index, self) =>
          index === self.findIndex((p) => p.id === product.id)
        );

        if (uniqueProductsToSync.length < productsToSync.length) {
          console.warn(`Deduplicated ${productsToSync.length - uniqueProductsToSync.length} products with duplicate IDs`);
        }

        toast.info('Saving products to database...');
        const success = await bulkUpsertProducts(uniqueProductsToSync);
        if (success) {
          await fetchProducts(); // Refresh from database to confirm persistence
          toast.success(`Sync complete! ${uniqueProductsToSync.length} products saved to database.`);
        } else {
          toast.error('Database save failed. Products only saved locally. Please log in as admin and try again.');
        }
      } catch (error) {
        console.error('Spreadsheet parsing failed:', error);
        toast.error("Failed to parse spreadsheet. Please ensure it's a valid CSV or Excel file.");
      } finally {
        setIsUploading(false);
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
