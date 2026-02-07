import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/adminStore';
import { parseSpreadsheet } from '@/lib/spreadsheet';
import { useProducts } from '@/hooks/useProducts';
import { PRODUCT_SIZES } from '@/lib/constants';

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
        let updatedCount = 0;

        rows.forEach((row, index) => {
          const rawId = row.id ? String(row.id) : '';
          const handle = row.handle ? String(row.handle) : '';
          const title = row.title ? String(row.title) : '';

          if (rawId || handle || title) {
            // 1. Find existing product for matching
            let existingProduct = allProducts?.find(p =>
              p.node.id === rawId ||
              p.node.id === `gid://shopify/Product/${rawId}` ||
              (handle && p.node.handle === handle) ||
              (title && p.node.title.toLowerCase() === title.toLowerCase())
            );

            const id = existingProduct
              ? existingProduct.node.id
              : (rawId
                  ? (rawId.startsWith('gid://') ? rawId : `gid://shopify/Product/${rawId}`)
                  : `sync-${index}`);

            // 2. Determine sizes
            const sizes = row.sizes
              ? String(row.sizes).split('|').map((s: string) => s.trim().toUpperCase())
              : (existingProduct?.node.options.find(o => o.name === 'Size')?.values);

            // 3. Handle size inventory
            let sizeInventory: Record<string, number> | undefined = undefined;
            if (row.size_inventory) {
              sizeInventory = {};
              String(row.size_inventory).split('|').forEach((part: string) => {
                const [s, q] = part.split(':');
                if (s && q) sizeInventory![s.trim().toUpperCase()] = parseInt(q.trim()) || 0;
              });
            } else if (row.inventory !== undefined) {
              // Auto-distribute total inventory if size_inventory is missing
              const total = parseInt(row.inventory) || 0;
              const targetSizes = sizes || [...PRODUCT_SIZES];
              sizeInventory = {};
              const perSize = Math.floor(total / (targetSizes.length || 1));
              targetSizes.forEach((s, idx) => {
                sizeInventory![s] = idx === targetSizes.length - 1 ? total - (perSize * (targetSizes.length - 1)) : perSize;
              });
            }

            // 4. Handle Image (check if it matches an uploaded file first)
            let image = existingProduct?.node.images.edges[0]?.node.url || "https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=800";
            if (row.image) {
              const rowImageStr = String(row.image);
              if (imageMap[rowImageStr]) {
                image = imageMap[rowImageStr];
              } else if (rowImageStr.startsWith('http')) {
                image = rowImageStr;
              }
            }

            // 5. Sanitize price
            let price = row.price ? String(row.price).replace(/[^0-9.]/g, '') : (existingProduct?.node.priceRange.minVariantPrice.amount || "0.00");

            updateProductOverride(id, {
              title: row.title ? String(row.title) : (existingProduct?.node.title || "New Product"),
              price: price,
              inventory: row.inventory !== undefined ? parseInt(row.inventory) : (existingProduct ? undefined : 0),
              sizes: sizes,
              sizeInventory: sizeInventory,
              image: image,
              description: row.description ? String(row.description) : (existingProduct?.node.description || "New luxury swimwear piece synced via inventory spreadsheet."),
              productType: row.category || row.type || row.product_type || row.producttype || (existingProduct?.node.productType || "")
            });
            updatedCount++;
          }
        });

        setTimeout(() => {
          setIsUploading(false);
          toast.success(`Sync complete! ${updatedCount} products updated.`);
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
    const csvContent = "id,title,price,inventory,sizes,size_inventory,image,description,category\ngid://shopify/Product/1,Copacabana Top,85.00,50,XS|S|M|L|XL|2XL,XS:10|S:10|M:10|L:10|XL:5|2XL:5,copacabana-top.jpg,Luxury triangle bikini top with gold hardware.,Bikinis\ngid://shopify/Product/2,Copacabana Bottom,75.00,45,XS|S|M|L|XL|2XL,XS:8|S:8|M:8|L:8|XL:7|2XL:6,copacabana-bottom.jpg,Matching tie-side bikini bottoms.,Bikinis\n";
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
