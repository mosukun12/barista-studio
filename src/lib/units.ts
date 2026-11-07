import { MeasurementUnit } from '../types';

export const STANDARD_UNITS: MeasurementUnit[] = [
  { id: 'u-oz', name: 'ออนซ์ (oz)', symbol: 'oz', unit_type: 'volume', is_convertible: true, conversion_factor_to_base: 29.5735, sort_order: 1 },
  { id: 'u-ml', name: 'มิลลิลิตร (ml)', symbol: 'ml', unit_type: 'volume', is_convertible: true, conversion_factor_to_base: 1, sort_order: 2 },
  { id: 'u-g', name: 'กรัม (g)', symbol: 'g', unit_type: 'weight', is_convertible: true, conversion_factor_to_base: 1, sort_order: 3 },
  { id: 'u-pump', name: 'ปั๊ม (Pump)', symbol: 'pump', unit_type: 'custom', is_convertible: false, sort_order: 4 },
  { id: 'u-shot', name: 'ช็อต (Shot)', symbol: 'shot', unit_type: 'custom', is_convertible: false, sort_order: 5 },
  { id: 'u-scoop', name: 'ช้อนตัก (Scoop)', symbol: 'scoop', unit_type: 'custom', is_convertible: false, sort_order: 6 },
  { id: 'u-kg', name: 'กิโลกรัม (kg)', symbol: 'kg', unit_type: 'weight', is_convertible: true, conversion_factor_to_base: 1000, sort_order: 7 },
  { id: 'u-l', name: 'ลิตร (L)', symbol: 'L', unit_type: 'volume', is_convertible: true, conversion_factor_to_base: 1000, sort_order: 8 },
  { id: 'u-tsp', name: 'ช้อนชา (tsp)', symbol: 'tsp', unit_type: 'volume', is_convertible: true, conversion_factor_to_base: 4.9289, sort_order: 9 },
  { id: 'u-tbsp', name: 'ช้อนโต๊ะ (tbsp)', symbol: 'tbsp', unit_type: 'volume', is_convertible: true, conversion_factor_to_base: 14.7868, sort_order: 10 },
  { id: 'u-pc', name: 'ชิ้น / ลูก (Piece)', symbol: 'pc', unit_type: 'count', is_convertible: false, sort_order: 11 },
  { id: 'u-slice', name: 'แว่น / แผ่น (Slice)', symbol: 'slice', unit_type: 'count', is_convertible: false, sort_order: 12 },
  { id: 'u-dash', name: 'หยด / เหยาะ (Dash)', symbol: 'dash', unit_type: 'custom', is_convertible: false, sort_order: 13 },
];

/**
 * Safely converts convertible units (ml <-> oz, g <-> kg).
 * Returns null if either unit is non-convertible or of mismatched physical types (e.g., volume vs count).
 */
export function convertUnit(
  value: number,
  fromSymbol: string,
  toSymbol: string,
  unitRegistry: MeasurementUnit[] = STANDARD_UNITS
): number | null {
  if (fromSymbol === toSymbol) return value;

  const fromUnit = unitRegistry.find((u) => u.symbol.toLowerCase() === fromSymbol.toLowerCase());
  const toUnit = unitRegistry.find((u) => u.symbol.toLowerCase() === toSymbol.toLowerCase());

  if (!fromUnit || !toUnit) return null;
  if (!fromUnit.is_convertible || !toUnit.is_convertible) return null;
  if (fromUnit.unit_type !== toUnit.unit_type) return null; // Can't convert volume to weight directly without density
  if (!fromUnit.conversion_factor_to_base || !toUnit.conversion_factor_to_base) return null;

  // Convert to base, then to target
  const baseValue = value * fromUnit.conversion_factor_to_base;
  const result = baseValue / toUnit.conversion_factor_to_base;
  return Math.round(result * 100) / 100;
}
