// CLIENTES
export {
  EstadoClienteSchema,
  CodigoPaisSchema,
  ContactoSchema,
  ContactoInputSchema,
  ClienteInputSchema,
  ClienteUpdateSchema,
  ClienteSchema,
} from './schemas/cliente.js';

export type {
  EstadoCliente,
  Contacto,
  ContactoInput,
  ClienteInput,
  ClienteUpdate,
  Cliente,
} from './schemas/cliente.js';

export { ContactoDetalleSchema, ClienteDetalleSchema } from './schemas/cliente.js';
export type { ClienteDetalle } from './schemas/cliente.js';

// FACTURAS
export { DecimalStringSchema, FacturaSchema } from './schemas/factura.js';
export type { Factura } from './schemas/factura.js';
