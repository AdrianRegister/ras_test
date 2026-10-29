# Gestión de clientes y facturas

Aplicación web para gestionar clientes, contactos, facturas y su información asociada. Incluye frontend Angular, API REST con Express y base de datos PostgreSQL.

## 1. Requisitos

- Docker Desktop con Docker Compose.
- Git, si se clona el repositorio.
- Node.js y npm únicamente para ejecutar las pruebas locales.

No es necesario instalar PostgreSQL en el equipo anfitrión para ejecutar la aplicación con Docker.

## 2. Arranque desde cero

Clonar el repositorio y entrar en su directorio raíz.

### Configurar variables de entorno

Copiar `.env.example` a `.env`:

```powershell
Copy-Item .env.example .env
```

Revisar las variables POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, DATABASE_URL y NODE_ENV. La URL de conexión debe utilizar el nombre del servicio Docker (postgres) como host, no localhost.

### Iniciar la aplicación

```powershell
docker compose up --build -d
```

Comprobar el estado:

```powershell
docker compose ps
```

La aplicación estará disponible en:

- **Frontend:** http://localhost:4200
- **API:** http://localhost:3000

Para consultar los registros:

```powershell
docker compose logs --tail 50 internal-app-db
docker compose logs --tail 50 internal-app-api
docker compose logs --tail 50 internal-app-web
```

### Inicialización de la base de datos

No se necesita una base de datos ni un volumen previamente creados. En una instalación nueva:

1. Docker crea el usuario y la base de datos de PostgreSQL a partir de las variables del .env.
2. PostgreSQL importa backend/queries/snapshot/ras_test_snapshot.sql.
3. El backend aplica la migración 001_add_session_token.sql.
4. El backend crea el usuario administrador si todavía no existe.

**Credenciales iniciales de la aplicación:**

- Usuario: `admin`
- Contraseña: `admin123`

Cambiar estas credenciales antes de utilizar la aplicación en un entorno real.

> La importación del snapshot solo se ejecuta cuando PostgreSQL inicializa un volumen vacío. Si ya existe un volumen, Docker conserva sus datos y no vuelve a importar el snapshot. No se debe eliminar un volumen que contenga datos que se quieran conservar.

## 3. Documentación de la API

La API utiliza el puerto `3000`. Las rutas protegidas requieren autenticación mediante la cookie de sesión.

- **URL base:** `http://localhost:3000`
- **Formato de intercambio:** JSON.

### Endpoints disponibles

| Método | Endpoint                      | Descripción                                                      |
| ------ | ----------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/health`                 | Comprobar el estado de la API y la conexión con la base de datos |
| GET    | `/api/clientes`               | Consultar clientes con paginación, búsqueda y filtros            |
| GET    | `/api/clientes/:id`           | Consultar los detalles de un cliente                             |
| GET    | `/api/clientes/:id/historico` | Consultar el historial de cambios de un cliente                  |
| POST   | `/api/clientes`               | Crear un cliente                                                 |
| PUT    | `/api/clientes/:id`           | Actualizar un cliente                                            |
| DELETE | `/api/clientes/:id`           | Eliminar un cliente mediante borrado lógico                      |

### Comprobar el estado de la API

#### `GET /api/health`

Comprueba que la API está funcionando y puede conectarse a PostgreSQL.

**Respuesta correcta — `200 OK`**

```json
{
  "status": "ok",
  "database": "connected"
}
```

Si la base de datos no está disponible, el endpoint devuelve `503 Service Unavailable`.

### Listar clientes

#### `GET /api/clientes`

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

### Consultar un cliente

#### `GET /api/clientes/:id`

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

### Crear un cliente

#### `POST /api/clientes`

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

### Actualizar un cliente

#### `PUT /api/clientes/:id`

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

### Consultar el historial de cambios

#### `GET /api/clientes/:id/historico`

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

### Eliminar un cliente

#### `DELETE /api/clientes/:id`

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

### Códigos HTTP utilizados

| Código                      | Significado                                 |
| --------------------------- | ------------------------------------------- |
| `200 OK`                    | Operación completada correctamente          |
| `201 Created`               | Recurso creado correctamente                |
| `400 Bad Request`           | Identificador o datos de entrada no válidos |
| `404 Not Found`             | Recurso no encontrado o no disponible       |
| `500 Internal Server Error` | Error inesperado del servidor               |
| `503 Service Unavailable`   | Servicio o dependencia no disponible        |

## 4. Comprobar el acceso sin autenticar

En PowerShell:

```powershell
Invoke-WebRequest http://localhost:3000/api/clientes
```

La petición debe devolver `401 Unauthorized` si no existe una sesión válida.

## 5. Probar el flujo de autenticación

En PowerShell, iniciar sesión y guardar la cookie:

```powershell
$body = @{
    nombre   = "admin"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri http://localhost:3000/api/users/login `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -SessionVariable session
```

Consultar los clientes utilizando la sesión autenticada:

```powershell
Invoke-WebRequest `
    -Uri http://localhost:3000/api/clientes `
    -WebSession $session
```

Cerrar sesión:

```powershell
Invoke-WebRequest `
    -Uri http://localhost:3000/api/users/logout `
    -Method POST `
    -WebSession $session
```

La cookie HttpOnly se conserva en la sesión de PowerShell y se envía automáticamente en las peticiones siguientes.

## 6. Ejecutar las pruebas automatizadas

Desde la raíz del proyecto:

```powershell
npm test
```

Las pruebas existentes utilizan Vitest y Supertest, con la base de datos simulada para probar el comportamiento de la API.

## 7. Decisiones técnicas

- **Angular:** interfaz de usuario y aplicación de página única.
- **Express y TypeScript:** API REST y lógica de servidor.
- **PostgreSQL:** persistencia relacional para clientes, contactos, facturas y entidades asociadas.
- **Docker Compose:** arranque coordinado de frontend, backend y base de datos.
- **Migraciones SQL:** evolución controlada del esquema sin depender de recrear la base de datos.
- **Validación y tipado:** TypeScript y Zod para mejorar la consistencia de los datos.
- **Contraseñas:** almacenamiento mediante hash derivado con scrypt, no en texto plano.
- **Sesiones:** cookie HttpOnly y token UUID almacenado en la base de datos.

## 8. Mejoras pendientes

- **Autenticación y seguridad:** sustituir el mecanismo de sesión actual por una implementación robusta de JWT, con validación rigurosa, expiración, renovación y revocación cuando corresponda. Revisar también la gestión de secretos, cookies, CORS y protección frente a ataques de fuerza bruta antes de producción.
- **Autorización:** definir roles y permisos si se incorporan distintos tipos de usuario.
- **Pruebas:** ampliar la cobertura de integración y añadir pruebas que utilicen una base de datos real de prueba.
- **Migraciones:** incorporar un sistema de versionado y ejecución de migraciones más estructurado a medida que crezca el esquema.
- **Operación:** añadir logging estructurado, monitorización y copias de seguridad automatizadas.
- **Producción:** servir el frontend mediante un servidor web de producción y configurar HTTPS, en lugar de utilizar el servidor de desarrollo de Angular.
