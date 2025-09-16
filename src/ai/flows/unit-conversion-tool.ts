'use server';

/**
 * @fileOverview A unit conversion AI agent.
 *
 * - unitConversion - A function that handles the unit conversion process.
 * - UnitConversionInput - The input type for the unitConversion function.
 * - UnitConversionOutput - The return type for the unitConversion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UnitConversionInputSchema = z.object({
  expression: z.string().describe('The mathematical expression to evaluate, potentially including mixed units.'),
});
export type UnitConversionInput = z.infer<typeof UnitConversionInputSchema>;

const UnitConversionOutputSchema = z.object({
  result: z.string().describe('The result of the calculation, converted to a common unit.'),
});
export type UnitConversionOutput = z.infer<typeof UnitConversionOutputSchema>;

export async function unitConversion(input: UnitConversionInput): Promise<UnitConversionOutput> {
  return unitConversionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'unitConversionPrompt',
  input: {schema: UnitConversionInputSchema},
  output: {schema: UnitConversionOutputSchema},
  prompt: `You are a calculator that can perform unit conversions.

  The user will provide a mathematical expression that may contain mixed units. Your task is to:

  1. Identify any units present in the expression.
  2. Convert all values to a common base unit (e.g., meters for length, kilograms for mass, seconds for time).
  3. Evaluate the expression.
  4. Return the result as a string, including the numerical value and the base unit.

  Example:
  User: 2 meters + 3 feet
  You: 2.9144 meters

  User: {{{expression}}}
  You: `,
});

const unitConversionFlow = ai.defineFlow(
  {
    name: 'unitConversionFlow',
    inputSchema: UnitConversionInputSchema,
    outputSchema: UnitConversionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      result: output!.result,
    };
  }
);
