import { z } from 'zod';
import { ClienteSchema } from './cliente.js';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  estado: z.enum(['Activo', 'Inactivo']).optional(),
  paisCodigo: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  comercialId: z.coerce.number().int().positive().optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedClientesSchema = z.object({
  data: z.array(ClienteSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type PaginatedClientes = z.infer<typeof PaginatedClientesSchema>;

export const HistoricoCambioSchema = z.object({
  id: z.number().int().positive(),
  clienteId: z.number().int().positive(),
  entidadTipo: z.enum(['cliente', 'contacto']),
  entidadId: z.number().int().positive(),
  campo: z.string(),
  valorAnterior: z.unknown().nullable(),
  valorNuevo: z.unknown().nullable(),
  usuarioId: z.number().int().positive().nullable(),
  actorTipo: z.enum(['usuario', 'sistema', 'importacion']),
  fechaHora: z.iso.datetime(),
});

export type HistoricoCambio = z.infer<typeof HistoricoCambioSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
