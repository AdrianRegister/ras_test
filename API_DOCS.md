# Documentación de la API — RAS Test

## 1. Información general

- **URL base:** `http://localhost:3000`
- **Prefijo de la API:** `/api/clientes`
- **Tecnologías:** Node.js, TypeScript, Express y PostgreSQL.
- **Formato de intercambio:** JSON.

## 2. Endpoints disponibles

| Método | Endpoint                      | Descripción                                                      |
| ------ | ----------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/health`                 | Comprobar el estado de la API y la conexión con la base de datos |
| GET    | `/api/clientes`               | Consultar clientes con paginación, búsqueda y filtros            |
| GET    | `/api/clientes/:id`           | Consultar los detalles de un cliente                             |
| GET    | `/api/clientes/:id/historico` | Consultar el historial de cambios de un cliente                  |
| POST   | `/api/clientes`               | Crear un cliente                                                 |
| PUT    | `/api/clientes/:id`           | Actualizar un cliente                                            |
| DELETE | `/api/clientes/:id`           | Eliminar un cliente mediante borrado lógico                      |

## 3. Comprobar el estado de la API

### `GET /api/health`

Comprueba que la API está funcionando y puede conectarse a PostgreSQL.

**Respuesta correcta — `200 OK`**

```json
{
  "status": "ok",
  "database": "connected"
}
```

Si la base de datos no está disponible, el endpoint devuelve `503 Service Unavailable`.

## 4. Listar clientes

### `GET /api/clientes`

Devuelve un listado paginado de clientes. Permite buscar por diferentes campos y filtrar los resultados.

**Parámetros de consulta**

| Parámetro   | Obligatorio | Descripción                            |
| ----------- | ----------- | -------------------------------------- |
| `page`      | No          | Número de página                       |
| `limit`     | No          | Número máximo de resultados por página |
| `search`    | No          | Término de búsqueda                    |
| `estado`    | No          | Filtrar por estado del cliente         |
| `pais`      | No          | Filtrar por país                       |
| `comercial` | No          | Filtrar por comercial asignado         |

**Ejemplo de petición**

```http
GET /api/clientes?page=1&limit=10&search=Barcelona&estado=Activo
```

**Respuesta — `200 OK`**

Devuelve los clientes que coinciden con los parámetros indicados, junto con los datos y la información de paginación definidos por la implementación.

## 5. Consultar un cliente

### `GET /api/clientes/:id`

Devuelve los datos de un cliente concreto, incluidos sus contactos, facturas y el importe total facturado.

**Parámetro de ruta**

- `id`: identificador numérico positivo del cliente.

**Ejemplo de petición**

```http
GET /api/clientes/1
```

**Respuestas posibles**

- `200 OK`: cliente encontrado.
- `400 Bad Request`: identificador no válido.
- `404 Not Found`: cliente no encontrado o no disponible.
- `500 Internal Server Error`: error inesperado del servidor.

## 6. Crear un cliente

### `POST /api/clientes`

Crea un nuevo cliente después de validar los datos recibidos.

**Campos obligatorios**

| Campo       | Tipo    | Descripción                          |
| ----------- | ------- | ------------------------------------ |
| `empresa`   | String  | Nombre o razón social                |
| `cif`       | String  | CIF de la empresa                    |
| `pais_id`   | Integer | Identificador de un país existente   |
| `estado_id` | Integer | Identificador de un estado existente |

**Campos opcionales**

| Campo           | Tipo    | Descripción                          |
| --------------- | ------- | ------------------------------------ |
| `direccion`     | String  | Dirección postal                     |
| `codigo_postal` | String  | Código postal                        |
| `ciudad`        | String  | Ciudad                               |
| `comercial_id`  | Integer | Identificador del comercial asignado |
| `fecha_alta`    | Fecha   | Fecha de alta del cliente            |

**Ejemplo de petición**

```http
POST /api/clientes
Content-Type: application/json
```

```json
{
  "empresa": "Empresa Ejemplo S.L.",
  "cif": "B12345678",
  "pais_id": 1,
  "estado_id": 1,
  "direccion": "Calle Mayor, 10",
  "codigo_postal": "08001",
  "ciudad": "Barcelona",
  "comercial_id": 1,
  "fecha_alta": "2026-10-29"
}
```

**Respuestas posibles**

- `201 Created`: cliente creado correctamente.
- `400 Bad Request`: datos no válidos.
- `500 Internal Server Error`: error inesperado del servidor.

## 7. Actualizar un cliente

### `PUT /api/clientes/:id`

Actualiza los datos de un cliente existente. La petición valida los datos y registra los cambios en el historial dentro de una transacción.

**Parámetro de ruta**

- `id`: identificador numérico positivo del cliente.

**Cuerpo de la petición**

Acepta los campos definidos para la creación del cliente, sujetos a las reglas de validación de actualización.

**Ejemplo de petición**

```http
PUT /api/clientes/1
Content-Type: application/json
```

```json
{
  "empresa": "Empresa Ejemplo Actualizada S.L.",
  "cif": "B12345678",
  "pais_id": 1,
  "estado_id": 1,
  "ciudad": "Girona"
}
```

**Respuestas posibles**

- `200 OK`: cliente actualizado correctamente.
- `400 Bad Request`: identificador o datos no válidos.
- `404 Not Found`: cliente no encontrado.
- `500 Internal Server Error`: error inesperado del servidor.

## 8. Consultar el historial de cambios

### `GET /api/clientes/:id/historico`

Devuelve el historial de cambios registrado para un cliente.

Cada registro incluye, entre otros datos:

- Identificador del registro.
- Tipo e identificador de la entidad afectada.
- Campo modificado.
- Valor anterior y valor nuevo.
- Usuario responsable, cuando esté disponible.
- Tipo de actor que realizó el cambio.
- Fecha y hora del cambio.

**Ejemplo de petición**

```http
GET /api/clientes/1/historico
```

**Respuestas posibles**

- `200 OK`: devuelve una lista de registros; puede estar vacía si no hay cambios.
- `400 Bad Request`: identificador no válido.
- `500 Internal Server Error`: error inesperado del servidor.

## 9. Eliminar un cliente

### `DELETE /api/clientes/:id`

Elimina un cliente mediante **borrado lógico** (_soft delete_). El registro no se borra físicamente de PostgreSQL: se actualizan los campos `deleted_at` y `updated_at`.

Este mecanismo permite conservar la información y las relaciones existentes, así como mantener la trazabilidad de los datos.

**Ejemplo de petición**

```http
DELETE /api/clientes/10
```

**Respuesta correcta — `200 OK`**

```json
{
  "message": "Cliente eliminado correctamente"
}
```

**Respuestas posibles**

- `200 OK`: cliente eliminado correctamente.
- `400 Bad Request`: identificador no válido.
- `404 Not Found`: cliente inexistente o ya eliminado.
- `500 Internal Server Error`: error inesperado del servidor.

Los clientes eliminados lógicamente dejan de aparecer en las consultas que filtran por `deleted_at IS NULL`.

## 10. Códigos HTTP utilizados

| Código                      | Significado                                 |
| --------------------------- | ------------------------------------------- |
| `200 OK`                    | Operación completada correctamente          |
| `201 Created`               | Recurso creado correctamente                |
| `400 Bad Request`           | Identificador o datos de entrada no válidos |
| `404 Not Found`             | Recurso no encontrado o no disponible       |
| `500 Internal Server Error` | Error inesperado del servidor               |
| `503 Service Unavailable`   | Servicio o dependencia no disponible        |

## 11. Notas técnicas

- Los identificadores de países, estados y comerciales deben corresponder a registros existentes.
- Los datos de entrada se validan antes de ejecutar las operaciones correspondientes.
- La actualización de clientes utiliza una transacción para mantener la coherencia entre los cambios y su historial.
- El borrado lógico permite conservar los registros en la base de datos.
- La API se ejecuta localmente en el puerto `3000`.
- Esta documentación describe los endpoints de la implementación actual; no implica que exista autenticación o autorización si estas funcionalidades no se han implementado.
