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

// Normalize size strings for consistency
const normalizeSize = (size: string): string => {
  const s = size.trim().toUpperCase();
  if (s === '2X-LARGE' || s === '2X LARGE' || s === 'DOUBLE XL') return '2XL';
  if (s === 'XXL') return 'XXL'; // Keep XXL if explicitly provided, but we could also map to 2XL
  return s;
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
          unitCost: string;
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
          const rawSize = (row.size ? String(row.size).toUpperCase().trim() : titleSize) || 'ONE_SIZE';
          const size = normalizeSize(rawSize);

          const collection = row.collection || '';
          // Group by Title + Collection to merge variants from spreadsheet
          // We no longer group primarily by ID if the goal is to merge rows with same name
          const groupKey = `${baseTitle}-${collection}`;
          
          if (!productGroups[groupKey]) {
            const slug = baseTitle.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');

            // Always use slug from product name as DB primary key to avoid collisions
            // when multiple products share the same spreadsheet Item ID
            const productId = slug || Math.random().toString(36).substring(7);

            productGroups[groupKey] = {
              baseTitle,
              id: productId,
              price: row.price ? String(row.price).replace(/[^0-9.]/g, '') : '0.00',
              unitCost: row.unitcost ? String(row.unitcost).replace(/[^0-9.]/g, '') : '0.00',
              productType: row.producttype || '',
              collection: collection,
              status: row.status || 'Active',
              sizeInventory: {},
              image: row.image,
              description: row.description,
              itemNumber: row.itemnumber || (row.id ? String(row.id) : undefined),
              colorCodes: row.colors ? parseColors(String(row.colors)) : undefined
            };
          }

          const stock = row.inventory !== undefined ? parseInt(row.inventory) || 0 : 0;
          // "Status" column = additional units ordered on top of existing stock
          const ordered = row.status ? parseInt(row.status) : NaN;
          const totalForSize = stock + (isNaN(ordered) ? 0 : ordered);
          productGroups[groupKey].sizeInventory[size] =
            (productGroups[groupKey].sizeInventory[size] || 0) + totalForSize;
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
            p.title.toLowerCase() === product.baseTitle.toLowerCase()
          );

          // Use existing product ID if found, otherwise use slug-based ID
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

          // Normalize status: if numeric (ordered qty), default to 'Active'
          let status = product.status || 'Active';
          const statusNum = parseInt(status);
          if (!isNaN(statusNum)) {
            // Status was a number (ordered quantity) - product is active
            status = 'Active';
          } else if (!['Active', 'Inactive', 'Draft'].includes(status)) {
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
            colorCodes: product.colorCodes,
            unitCost: product.unitCost,
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
    const { productOverrides } = useAdminStore.getState();
    const products = Object.values(productOverrides).filter(p => !p.isDeleted);
    
    if (products.length === 0) {
      // Fallback to template if no products
      const csvContent = `Item Name,Type,Price,Unit Cost,Stock,Collection,Status,Item Number,Color\n`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nina_armend_products.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Empty template downloaded!");
      return;
    }

    // Build CSV rows from actual product data
    const headers = ['Item Name', 'Type', 'Price', 'Unit Cost', 'Stock', 'Collection', 'Status', 'Item Number', 'Color'];
    const rows = products.map(p => {
      const escapeCsv = (val: string) => val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      return [
        escapeCsv(p.title || ''),
        escapeCsv(p.productType || p.category || ''),
        p.price || '0.00',
        p.unitCost || '0.00',
        String(p.inventory || 0),
        escapeCsv(p.collection || ''),
        p.status || 'Active',
        escapeCsv(p.itemNumber || ''),
        escapeCsv((p.colorCodes || []).join(','))
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nina_armend_products_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Spreadsheet downloaded with ${products.length} products!`);
  };

  return {
    isUploading,
    handleFileUpload,
    downloadTemplate,
    fileInputRef
  };
}
