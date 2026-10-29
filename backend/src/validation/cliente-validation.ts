import { z } from 'zod';

export const nuevoClienteSchema = z.object({
  empresa: z.string().trim().min(1, 'La empresa es obligatoria'),
  cif: z
    .string()
    .trim()
    .min(1, 'El CIF es obligatorio')
    .transform((value) => value.toUpperCase()),
  pais_id: z.number().int().positive(),
  estado_id: z.number().int().positive(),
  direccion: z.string().trim().nullable().optional(),
  codigo_postal: z.string().trim().nullable().optional(),
  ciudad: z.string().trim().nullable().optional(),
  comercial_id: z.number().int().positive().nullable().optional(),
  fecha_alta: z.iso.date().nullable().optional(),
});

export const actualizarClienteSchema = z.object({
  empresa: z.string().trim().min(1, 'La empresa es obligatoria'),
  cif: z
    .string()
    .trim()
    .min(1, 'El CIF es obligatorio')
    .transform((value) => value.toUpperCase()),
  pais_id: z.number().int().positive(),
  estado_id: z.number().int().positive(),
  direccion: z.string().trim().nullable().optional(),
  codigo_postal: z.string().trim().nullable().optional(),
  ciudad: z.string().trim().nullable().optional(),
  comercial_id: z.number().int().positive().nullable().optional(),
  fecha_alta: z.iso.date().nullable().optional(),
});

export type NuevoCliente = z.infer<typeof nuevoClienteSchema>;
export type ActualizarCliente = z.infer<typeof actualizarClienteSchema>;
