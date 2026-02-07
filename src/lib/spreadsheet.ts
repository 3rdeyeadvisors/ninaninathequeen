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
      const normalizedKey = key.toLowerCase().trim();
      normalizedRow[normalizedKey] = row[key];
    });
    return normalizedRow;
  });
}
