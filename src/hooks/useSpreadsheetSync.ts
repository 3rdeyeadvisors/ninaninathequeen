import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/adminStore';
import { parseSpreadsheet } from '@/lib/spreadsheet';
import { useProducts } from '@/hooks/useProducts';
import { PRODUCT_SIZES } from '@/lib/constants';

// Upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 500;

// Normalize title to handle inconsistencies like "One Piece" vs "One-Piece"
const normalizeTitle = (title: string): string => {
  return title
    .replace(/one piece/gi, 'One-Piece')  // Standardize "One Piece" → "One-Piece"
    .replace(/\s+/g, ' ')                   // Collapse multiple spaces
    .trim();
};

export function useSpreadsheetSync() {
  const { data: allProducts } = useProducts(200);
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

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as ArrayBuffer;
        const rows = parseSpreadsheet(data);
        
        // Validate row count
        if (rows.length > MAX_ROWS) {
          toast.error(`Too many rows (${rows.length}). Maximum ${MAX_ROWS} allowed.`);
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
        }> = {};

        rows.forEach((row) => {
          const title = row.title ? String(row.title) : '';
          if (!title) return;

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
              description: row.description
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

        let updatedCount = 0;

        Object.values(productGroups).forEach((product) => {
          // Find existing product for matching
          let existingProduct = allProducts?.find(p =>
            p.node.id === product.id ||
            p.node.id === `gid://shopify/Product/${product.id}` ||
            p.node.title.toLowerCase() === product.baseTitle.toLowerCase()
          );

          const id = existingProduct
            ? existingProduct.node.id
            : (product.id.startsWith('gid://') ? product.id : `gid://shopify/Product/${product.id}`);

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
          let image = existingProduct?.node.images.edges[0]?.node.url || 
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

          updateProductOverride(id, {
            title: product.baseTitle,
            price: product.price,
            inventory: totalInventory,
            sizes: sizes,
            sizeInventory: product.sizeInventory,
            image: image,
            description: product.description || existingProduct?.node.description || 
              `Luxury ${product.productType.toLowerCase()} from the ${product.collection || 'Nina Armend'} collection.`,
            productType: product.productType,
            collection: product.collection,
            category: category,
            status: product.status as 'Active' | 'Inactive' | 'Draft'
          });
          updatedCount++;
        });

        setTimeout(() => {
          setIsUploading(false);
          toast.success(`Sync complete! ${updatedCount} products created from ${rows.length} inventory rows.`);
        }, 1500);
      } catch (error) {
        console.error('Spreadsheet parsing failed:', error);
        setIsUploading(false);
        toast.error("Failed to parse spreadsheet. Please ensure it's a valid CSV or Excel file.");
      }
    };
    reader.readAsArrayBuffer(spreadsheetFile);
  };

  const downloadTemplate = () => {
    const csvContent = `Item ID,Item Name,Type,Price Per Unit,Stock,Collection,Status
LB-001,White Top (XS),Top,85.00,10,La Bella,Active
LB-002,White Top (S),Top,85.00,15,La Bella,Active
LB-003,White Bottom (XS),Bottom,75.00,8,La Bella,Active
EM-001,Black One-Piece (M),One-Piece,120.00,5,El Mar,Active
EM-002,Black One-Piece Plus,One-Piece,130.00,3,El Mar,Active
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
