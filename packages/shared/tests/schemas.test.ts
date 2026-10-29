import { describe, expect, it } from 'vitest';

import {
  ApiErrorSchema,
  ClienteDetalleSchema,
  ClienteInputSchema,
  ClienteSchema,
  ContactoSchema,
  FacturaSchema,
  HistoricoCambioSchema,
  PaginatedClientesSchema,
  PaginationQuerySchema,
} from '../src/index.js';

const validCliente = {
  id: 1,
  empresa: 'Construcciones Ebro, S.L.',
  cif: 'B12345678',
  direccion: 'Calle Mayor, 10',
  codigoPostal: '08001',
  ciudad: 'Barcelona',
  paisCodigo: 'ES',
  paisNombre: 'España',
  comercialId: 2,
  comercialNombre: 'Ana García',
  estado: 'Activo',
  fechaAlta: '2026-01-15',
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-16T12:30:00.000Z',
} as const;

const validContacto = {
  id: 10,
  nombre: 'Luis Pérez',
  email: 'luis@example.com',
  telefono: '+34600111222',
};

const validFactura = {
  id: 20,
  clienteId: 1,
  numeroFactura: 'F-2026-001',
  fechaFactura: '2026-02-01',
  baseImponible: '1000.00',
  ivaPorcentaje: '21.00',
  importeIva: '210.00',
  total: '1210.00',
  createdAt: '2026-02-01T09:00:00.000Z',
  updatedAt: '2026-02-01T09:00:00.000Z',
};

describe('ClienteInputSchema', () => {
  it('accepts valid client input', () => {
    const result = ClienteInputSchema.safeParse({
      empresa: '  Empresa Ejemplo S.L.  ',
      cif: 'B12345678',
      ciudad: 'Barcelona',
      paisCodigo: 'ES',
      estado: 'Activo',
      fechaAlta: '2026-01-15',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.empresa).toBe('Empresa Ejemplo S.L.');
    }
  });

  it('rejects an empty company name', () => {
    expect(
      ClienteInputSchema.safeParse({
        empresa: ' ',
        ciudad: 'Barcelona',
        paisCodigo: 'ES',
        estado: 'Activo',
        fechaAlta: '2026-01-15',
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid country code', () => {
    expect(
      ClienteInputSchema.safeParse({
        empresa: 'Empresa Ejemplo',
        ciudad: 'Barcelona',
        paisCodigo: 'ESP',
        estado: 'Activo',
        fechaAlta: '2026-01-15',
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid date', () => {
    expect(
      ClienteInputSchema.safeParse({
        empresa: 'Empresa Ejemplo',
        ciudad: 'Barcelona',
        paisCodigo: 'ES',
        estado: 'Activo',
        fechaAlta: '2026-02-30',
      }).success,
    ).toBe(false);
  });

  it('allows a missing CIF', () => {
    expect(
      ClienteInputSchema.safeParse({
        empresa: 'Empresa Ejemplo',
        ciudad: 'Barcelona',
        paisCodigo: 'ES',
        estado: 'Activo',
        fechaAlta: '2026-01-15',
      }).success,
    ).toBe(true);
  });
});

describe('ClienteSchema', () => {
  it('accepts a valid client response', () => {
    expect(ClienteSchema.safeParse(validCliente).success).toBe(true);
  });

  it('rejects an invalid client ID', () => {
    expect(
      ClienteSchema.safeParse({
        ...validCliente,
        id: 0,
      }).success,
    ).toBe(false);
  });

  it('rejects an unsupported status', () => {
    expect(
      ClienteSchema.safeParse({
        ...validCliente,
        estado: 'Pendiente',
      }).success,
    ).toBe(false);
  });
});

describe('ContactoSchema', () => {
  it('accepts a contact with no email or phone', () => {
    expect(
      ContactoSchema.safeParse({
        id: 10,
        nombre: 'Luis Pérez',
        email: null,
        telefono: null,
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(
      ContactoSchema.safeParse({
        ...validContacto,
        email: 'not-an-email',
      }).success,
    ).toBe(false);
  });
});

describe('FacturaSchema', () => {
  it('accepts a valid invoice with decimal strings', () => {
    expect(FacturaSchema.safeParse(validFactura).success).toBe(true);
  });

  it('rejects a numeric monetary value', () => {
    expect(
      FacturaSchema.safeParse({
        ...validFactura,
        baseImponible: 1000,
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid invoice date', () => {
    expect(
      FacturaSchema.safeParse({
        ...validFactura,
        fechaFactura: '2026-02-30',
      }).success,
    ).toBe(false);
  });
});

describe('ClienteDetalleSchema', () => {
  it('accepts a client with contacts, invoices and cumulative billing', () => {
    expect(
      ClienteDetalleSchema.safeParse({
        ...validCliente,
        contactos: [
          {
            ...validContacto,
            createdAt: '2026-01-15T10:00:00.000Z',
            updatedAt: '2026-01-15T10:00:00.000Z',
          },
        ],
        facturas: [validFactura],
        facturacionAcumulada: '1000.00',
      }).success,
    ).toBe(true);
  });
});

describe('PaginationQuerySchema', () => {
  it('applies default page and limit', () => {
    expect(PaginationQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it('coerces query-string numbers', () => {
    expect(
      PaginationQuerySchema.parse({
        page: '2',
        limit: '50',
      }),
    ).toEqual({
      page: 2,
      limit: 50,
    });
  });

  it('rejects a limit above 100', () => {
    expect(
      PaginationQuerySchema.safeParse({
        limit: '101',
      }).success,
    ).toBe(false);
  });
});

describe('PaginatedClientesSchema', () => {
  it('accepts a valid paginated response', () => {
    expect(
      PaginatedClientesSchema.safeParse({
        data: [validCliente],
        pagination: {
          page: 1,
          limit: 20,
          totalItems: 1,
          totalPages: 1,
        },
      }).success,
    ).toBe(true);
  });
});

describe('HistoricoCambioSchema', () => {
  it('accepts a valid audit record', () => {
    expect(
      HistoricoCambioSchema.safeParse({
        id: 1,
        clienteId: 1,
        entidadTipo: 'cliente',
        entidadId: 1,
        campo: 'empresa',
        valorAnterior: 'Empresa Antigua',
        valorNuevo: 'Empresa Nueva',
        usuarioId: 5,
        actorTipo: 'usuario',
        fechaHora: '2026-03-01T12:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('accepts a system change without a user ID', () => {
    expect(
      HistoricoCambioSchema.safeParse({
        id: 2,
        clienteId: 1,
        entidadTipo: 'contacto',
        entidadId: 10,
        campo: 'telefono',
        valorAnterior: null,
        valorNuevo: '+34600111222',
        usuarioId: null,
        actorTipo: 'sistema',
        fechaHora: '2026-03-01T12:00:00.000Z',
      }).success,
    ).toBe(true);
  });
});

describe('ApiErrorSchema', () => {
  it('accepts a structured API error', () => {
    expect(
      ApiErrorSchema.safeParse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request contains invalid fields',
          details: [{ field: 'empresa' }],
        },
      }).success,
    ).toBe(true);
  });

  it('rejects an error without a code', () => {
    expect(
      ApiErrorSchema.safeParse({
        error: {
          message: 'Something went wrong',
        },
      }).success,
    ).toBe(false);
  });
});
