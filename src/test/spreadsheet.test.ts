import { describe, it, expect } from 'vitest';
import { parseSpreadsheet } from '../lib/spreadsheet';
import * as XLSX from 'xlsx';

describe('parseSpreadsheet', () => {
  it('should map stock/qty/quantity headers to inventory', () => {
    const csvContent = "Id,Title,Stock,Sizes\n1,Test Product,100,S|M|L";
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const rows = parseSpreadsheet(arrayBuffer);
    expect(rows[0]).toHaveProperty('inventory', 100);
    expect(rows[0]).toHaveProperty('id', 1);
    expect(rows[0]).toHaveProperty('title', 'Test Product');
  });

  it('should map qty to inventory', () => {
    const csvContent = "Id,Title,Qty,Sizes\n1,Test Product,50,S|M|L";
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const rows = parseSpreadsheet(arrayBuffer);
    expect(rows[0]).toHaveProperty('inventory', 50);
  });

  it('should support size column', () => {
    const csvContent = "Id,Title,Inventory,Size\n1,Test Product,10,XL";
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const rows = parseSpreadsheet(arrayBuffer);
    expect(rows[0]).toHaveProperty('size', 'XL');
  });

  it('should map various size headers to size', () => {
    const csvContent = "Id,Title,Inventory,Variant\n1,Test Product,10,M";
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const rows = parseSpreadsheet(arrayBuffer);
    expect(rows[0]).toHaveProperty('size', 'M');
  });

  it('should map Price Per Unit to unitcost', () => {
    const csvContent = "Id,Title,Price Per Unit,Stock\n1,Test Product,85.00,10";
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const rows = parseSpreadsheet(arrayBuffer);
    expect(rows[0]).toHaveProperty('unitcost', 85.00);
  });

  it('should map Stock Amount to inventory', () => {
    const csvContent = "Id,Title,Price,Stock Amount\n1,Test Product,85.00,25";
    const workbook = XLSX.read(csvContent, { type: 'string' });
    const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const rows = parseSpreadsheet(arrayBuffer);
    expect(rows[0]).toHaveProperty('inventory', 25);
  });
});
