import { z } from 'zod';
import { FacturaSchema, DecimalStringSchema } from './factura.js';

export const EstadoClienteSchema = z.enum(['Activo', 'Inactivo']);

export const CodigoPaisSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}$/, 'Must be an ISO alpha-2 country code');

export const ContactoSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  email: z.email().nullable(),
  telefono: z.string().nullable(),
});

export const ContactoInputSchema = z.object({
  nombre: z.string().trim().min(1, 'Contact name is required'),
  email: z.email().nullable().optional(),
  telefono: z.string().trim().nullable().optional(),
});

export const ClienteInputSchema = z.object({
  empresa: z.string().trim().min(1, 'Company name is required'),
  cif: z.string().trim().min(1).nullable().optional(),
  direccion: z.string().trim().nullable().optional(),
  codigoPostal: z.string().trim().nullable().optional(),
  ciudad: z.string().trim().min(1, 'City is required'),
  paisCodigo: CodigoPaisSchema,
  comercialId: z.number().int().positive().nullable().optional(),
  estado: EstadoClienteSchema,
  fechaAlta: z.iso.date(),
  contactos: z.array(ContactoInputSchema).optional(),
});

export const ClienteUpdateSchema = ClienteInputSchema;

export const ClienteSchema = z.object({
  id: z.number().int().positive(),
  empresa: z.string(),
  cif: z.string().nullable(),
  direccion: z.string().nullable(),
  codigoPostal: z.string().nullable(),
  ciudad: z.string(),
  paisCodigo: CodigoPaisSchema,
  paisNombre: z.string(),
  comercialId: z.number().int().positive().nullable(),
  comercialNombre: z.string().nullable(),
  estado: EstadoClienteSchema,
  fechaAlta: z.iso.date(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ContactoDetalleSchema = ContactoSchema.extend({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ClienteDetalleSchema = ClienteSchema.extend({
  contactos: z.array(ContactoDetalleSchema),
  facturas: z.array(FacturaSchema),
  facturacionAcumulada: DecimalStringSchema,
});

export type ClienteDetalle = z.infer<typeof ClienteDetalleSchema>;
export type EstadoCliente = z.infer<typeof EstadoClienteSchema>;
export type Contacto = z.infer<typeof ContactoSchema>;
export type ContactoInput = z.infer<typeof ContactoInputSchema>;
export type ClienteInput = z.infer<typeof ClienteInputSchema>;
export type ClienteUpdate = z.infer<typeof ClienteUpdateSchema>;
export type Cliente = z.infer<typeof ClienteSchema>;
