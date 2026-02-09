import * as XLSX from 'xlsx';

/**
 * Parses an ArrayBuffer (from a CSV or Excel file) into an array of objects.
 * Normalizes all keys to lowercase and trims whitespace.
 */
export function parseSpreadsheet(data: ArrayBuffer): any[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet);

  return json.map((row: any) => {
    const normalizedRow: any = {};
    Object.keys(row).forEach((key) => {
      let normalizedKey = key.toLowerCase().trim();

      // Map common variations to standard keys (your exact column names)
      if (['item id', 'itemid', 'sku', 'product_id', 'productid', 'id'].includes(normalizedKey)) {
        normalizedKey = 'id';
      }
      if (['item name', 'itemname', 'product_name', 'productname', 'name', 'title'].includes(normalizedKey)) {
        normalizedKey = 'title';
      }
      if (['type', 'product type', 'producttype', 'category'].includes(normalizedKey)) {
        normalizedKey = 'producttype';
      }
      if (['price per unit', 'unit price', 'price', 'cost'].includes(normalizedKey)) {
        normalizedKey = 'price';
      }
      if (['stock', 'qty', 'quantity', 'inventory'].includes(normalizedKey)) {
        normalizedKey = 'inventory';
      }
      if (['collection', 'collections'].includes(normalizedKey)) {
        normalizedKey = 'collection';
      }
      if (['status', 'product status'].includes(normalizedKey)) {
        normalizedKey = 'status';
      }
      if (['item number', 'item#', 'item #', 'itemnumber', 'sku'].includes(normalizedKey)) {
        normalizedKey = 'itemnumber';
      }
      if (['color', 'colors', 'color code', 'colorcodes', 'hex', 'color hex'].includes(normalizedKey)) {
        normalizedKey = 'colors';
      }
      if (['size', 'sizes', 'sizing', 'variant', 'variation'].includes(normalizedKey)) {
        normalizedKey = 'size';
      }

      normalizedRow[normalizedKey] = row[key];
    });
    return normalizedRow;
  });
}
