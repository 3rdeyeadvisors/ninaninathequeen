import { describe, it, expect } from 'vitest';
import { parseSpreadsheet } from '../lib/spreadsheet';

describe('spreadsheet utility', () => {
  it('should parse CSV data and normalize keys', () => {
    const csvContent = 'ID,Title,Price\n1,Product 1,10.00\n2,Product 2,20.00';
    const encoder = new TextEncoder();
    const data = encoder.encode(csvContent).buffer;

    const result = parseSpreadsheet(data);

    expect(result).toHaveLength(2);
    // XLSX might parse numeric strings as numbers
    expect(result[0].id).toBe(1);
    expect(result[0].title).toBe('Product 1');
    expect(result[0].price).toBe(10);
  });

  it('should handle whitespace in headers', () => {
    const csvContent = ' id , title , price \n1,Product 1,10.00';
    const encoder = new TextEncoder();
    const data = encoder.encode(csvContent).buffer;

    const result = parseSpreadsheet(data);

    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('price');
  });
});
