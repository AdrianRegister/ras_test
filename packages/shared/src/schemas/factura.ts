import { z } from 'zod';

/**
 * PostgreSQL NUMERIC values are represented as decimal strings
 * in API responses to avoid floating-point precision loss.
 */
export const DecimalStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a decimal string');

export const FacturaSchema = z.object({
  id: z.number().int().positive(),
  clienteId: z.number().int().positive(),
  numeroFactura: z.string(),
  fechaFactura: z.iso.date(),
  baseImponible: DecimalStringSchema,
  ivaPorcentaje: DecimalStringSchema,
  importeIva: DecimalStringSchema,
  total: DecimalStringSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Factura = z.infer<typeof FacturaSchema>;
