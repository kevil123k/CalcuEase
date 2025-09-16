
'use server';

import { unitConversion, type UnitConversionOutput } from '@/ai/flows/unit-conversion-tool';

export async function performUnitConversion(expression: string): Promise<{ data: UnitConversionOutput | null; error: string | null }> {
  try {
    const result = await unitConversion({ expression });
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: 'Failed to perform unit conversion.' };
  }
}
