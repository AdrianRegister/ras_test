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
docker compose logs --tail 50 postgres
docker compose logs --tail 50 backend
docker compose logs --tail 50 frontend
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

- **Angular:** elegido para desarrollar la interfaz de usuario como una aplicación de página única (SPA). La elección responde principalmente a la familiaridad previa con el framework, lo que permite aprovechar conocimientos existentes y acelerar el desarrollo. Además, ofrece una estructura clara para organizar componentes, servicios, rutas y formularios, facilitando el mantenimiento de la aplicación.

- **Express y TypeScript:** Express se utiliza para implementar la API REST y la lógica del servidor. Se ha priorizado por su sencillez, flexibilidad y bajo overhead frente a alternativas más estructuradas como NestJS. Esto permite mantener una arquitectura ligera, sin introducir capas de abstracción o convenciones adicionales que no resultan necesarias para el alcance del proyecto. TypeScript aporta tipado estático, mejor autocompletado y detección temprana de errores durante el desarrollo.

- **PostgreSQL:** elegido como sistema de persistencia por su modelo relacional y sus garantías de integridad referencial. Permite representar de forma estructurada las relaciones entre clientes, contactos, facturas y entidades asociadas, así como aplicar restricciones y claves foráneas para mantener la coherencia de los datos.

- **Docker Compose:** utilizado para coordinar el arranque y la configuración del frontend, backend y base de datos. Cada servicio se ejecuta en su propio contenedor y se comunica con los demás a través de la red interna de Docker. Esto facilita reproducir el entorno de desarrollo o despliegue, reduce las dependencias del equipo anfitrión y simplifica la puesta en marcha del proyecto.

- **Librerías especializadas:** se han elegido librerías específicas para resolver tareas de normalización y validación, evitando implementar manualmente funcionalidades complejas o propensas a errores:

  **Day.js:** para la normalización y validación de fechas. Su tamaño reducido y su API sencilla permiten trabajar con distintos formatos de entrada. Mediante el plugin CustomParseFormat y el análisis estricto, se rechazan fechas inexistentes o inválidas en lugar de interpretarlas automáticamente.

  **libphonenumber-js:** para analizar y validar números de teléfono teniendo en cuenta los formatos internacionales y los códigos de país. También permite normalizarlos al formato internacional E.164, conservando la información necesaria para interpretar correctamente los prefijos.

  **@internationalized/number:** para interpretar importes con distintos formatos regionales, especialmente separadores decimales y de miles habituales en España y Europa. Evita depender de conversiones numéricas genéricas que podrían interpretar incorrectamente valores como 1.875,60.

  **csv:** para leer el fichero CSV respetando su estructura, incluyendo separadores, campos entrecomillados y caracteres escapados. Se ha preferido una librería específica frente a implementar un parser propio, reduciendo el riesgo de errores en la lectura.

  **Zod:** para validar y transformar datos en tiempo de ejecución, especialmente en los límites de entrada de la aplicación. También permite inferir tipos TypeScript a partir de los esquemas, reduciendo la duplicación entre validaciones y definiciones de tipos.

  Para transformaciones más específicas, como la normalización de nombres de empresa, CIF, correos electrónicos, países y estados, se utilizan funciones propias adaptadas a las reglas del proyecto.

- **Validación y tipado:** TypeScript proporciona contratos de datos y comprobaciones estáticas en el código, mientras que Zod permite validar los datos en tiempo de ejecución, especialmente los recibidos a través de la API. Esta combinación ayuda a detectar entradas incorrectas antes de que lleguen a la lógica de negocio o a la base de datos.

- **Contraseñas:** las contraseñas no se almacenan en texto plano. Se utiliza `scrypt` para generar un hash derivado, incorporando una sal (_salt_) para dificultar los ataques basados en tablas precalculadas y evitar que contraseñas iguales produzcan hashes idénticos. La autenticación compara el hash calculado con el almacenado.

- **Sesiones:** la autenticación utiliza una cookie `HttpOnly` para transportar el identificador de sesión sin permitir su lectura directa desde JavaScript del navegador. El token es un UUID almacenado en la base de datos, lo que permite validar las sesiones en el servidor y gestionar su revocación mediante la eliminación o invalidación del registro correspondiente.

## 8. Mejoras pendientes

- **CRUD de contactos de cliente:** no era un requisito del proyecto, pero sería lógico implementarlo. Se podría hacer sencillamente siguiendo los patrones arquitecturales de la API ya establecidos.

- **Autenticación y seguridad:** reforzar el mecanismo de autenticación actual, incorporando una gestión de tokens más completa, con validación, expiración, renovación y revocación cuando corresponda. Revisar también la gestión de secretos, la configuración de cookies y CORS, y añadir protección frente a ataques de fuerza bruta antes de un despliegue en producción.

- **Autorización:** definir un sistema de roles y permisos si la aplicación evoluciona para dar acceso a distintos tipos de usuarios, limitando las operaciones disponibles según sus responsabilidades.

- **Pruebas:** ampliar la cobertura de integración y añadir pruebas contra una instancia real de PostgreSQL en un entorno aislado, para verificar también las consultas, restricciones y relaciones de la base de datos.

- **Migraciones:** adoptar un sistema de versionado y ejecución de migraciones más estructurado, que facilite controlar los cambios del esquema y aplicarlos de forma reproducible en distintos entornos.

- **Operación e infraestructura:** incorporar logging estructurado, monitorización y copias de seguridad automatizadas. Como posible evolución, la base de datos podría alojarse en un servicio gestionado en la nube, como **AWS RDS**, delegando tareas operativas como mantenimiento, actualizaciones y gestión de copias de seguridad al proveedor.

- **Producción:** sustituir los servidores de desarrollo de Angular y Express por servidores web adecuados para producción y configurar HTTPS, junto con los ajustes necesarios de despliegue y configuración de los distintos servicios. Esto se podría hacer a través de servicios de hosting gestionado, como **Vercel** / **cloudflare**, o en la nube con **AWS Amplify** / **AWS Fargate**.

## Apéndice: Normalización e importación de datos CSV

### 1. Objetivo y diseño general

El proyecto incluye un pipeline para migrar los datos históricos de clientes y facturas desde un fichero CSV a PostgreSQL.

El objetivo no es insertar directamente los valores originales, sino realizar un proceso previo de lectura, normalización y validación para reducir inconsistencias y evitar que datos incompletos o incorrectos contaminen la base de datos.

El proceso se divide conceptualmente en estas fases:

1. Lectura del CSV.
2. Normalización de los valores.
3. Clasificación y validación de los registros.
4. Ejecución de una simulación (_dry run_) o de la importación.
5. Registro de resultados y errores.

El fichero de origen se encuentra en:

`backend/data/clientes_antiguos.csv`

Se mantiene dentro del repositorio para que la importación y sus pruebas no dependan de rutas locales, como el escritorio del desarrollador o el directorio desde el que se ejecuta el proceso.

### 2. Lectura del CSV

El módulo responsable de la lectura utiliza `csv/sync`.

La configuración contempla las características del fichero de origen:

- Codificación UTF-8.
- Compatibilidad con BOM (_Byte Order Mark_).
- Separador de campos `;`.
- Cabeceras para identificar las columnas.
- Campos entrecomillados.
- Eliminación de espacios innecesarios.
- Omisión de líneas vacías.
- Comprobación del número de columnas de cada registro.
- Conservación de la información de fila para facilitar la identificación de errores.

La lectura se ha probado con el fichero real, que contiene 18 registros. Las pruebas verificaron, entre otros aspectos, la conservación de caracteres acentuados, la presencia de registros sin factura y la conservación de números de factura repetidos.

Es importante no descartar automáticamente los registros con factura vacía ni eliminar duplicados durante la lectura: esas decisiones corresponden a fases posteriores del proceso.

### 3. Normalización de datos

La normalización transforma los valores originales en una representación coherente antes de validarlos o utilizarlos para buscar entidades existentes en la base de datos.

Se contemplan los siguientes grupos de datos:

| Campo              | Tratamiento                            |
| ------------------ | -------------------------------------- |
| Empresa            | Limpieza y normalización del texto     |
| CIF                | Normalización del identificador fiscal |
| Correo electrónico | Limpieza y validación del formato      |
| Teléfono           | Normalización y comprobación           |
| País               | Normalización del valor textual        |
| Estado             | Normalización del estado del cliente   |
| Fechas             | Normalización y validación del formato |
| Importes           | Normalización de valores monetarios    |

La finalidad es evitar que diferencias de formato —por ejemplo, espacios sobrantes o representaciones distintas de un mismo valor— provoquen inconsistencias durante la importación o dificulten la identificación de clientes existentes.

La normalización y la validación son responsabilidades diferentes: un valor puede ser transformado correctamente y seguir siendo inválido desde el punto de vista de las reglas de negocio.

### 4. Validación y clasificación de registros

Una vez normalizados, los registros se clasifican según su validez.

Las reglas documentadas incluyen:

**Datos obligatorios**

- Empresa.
- País.
- Estado del cliente.

**Validaciones de formato**

- Correo electrónico.
- Fechas.
- Valores monetarios.

**Advertencias**

- Los teléfonos pueden generar advertencias cuando no cumplen las comprobaciones previstas, sin que necesariamente se considere inválido todo el registro.

**Facturas opcionales**

Un cliente puede no tener factura asociada. En ese caso, el registro del cliente no debe descartarse por ese motivo.

Sin embargo, si un registro contiene información de factura, deben estar presentes y ser válidos los campos correspondientes:

- Número de factura.
- Fecha de factura.
- Base imponible.
- Porcentaje de IVA, dentro del intervalo de 0 a 100.

Esta distinción permite conservar clientes sin facturas y, al mismo tiempo, evitar la creación de facturas incompletas.

### 5. Organización de los módulos

La lógica se distribuye en módulos independientes dentro de `backend/src/import/`:

| Módulo                   | Responsabilidad                              |
| ------------------------ | -------------------------------------------- |
| `csv-reader.ts`          | Lectura del fichero CSV                      |
| `classify-import-row.ts` | Clasificación y validación de registros      |
| `dry-run.ts`             | Ejecución de la simulación                   |
| `import-data.ts`         | Lógica de importación                        |
| `import-logger.ts`       | Registro de resultados                       |
| `import-types.ts`        | Tipos compartidos del proceso                |
| `lookup-resolver.ts`     | Resolución de referencias                    |
| `match-csv-clients.ts`   | Identificación y correspondencia de clientes |
| `run-dry-run.ts`         | Punto de entrada para la simulación          |
| `run-import.ts`          | Punto de entrada para la importación         |

La separación permite mantener diferenciadas la lectura, la transformación, la validación y las operaciones de importación. También facilita probar cada responsabilidad de forma independiente.

La lógica de normalización se encuentra separada bajo `backend/src/normalization/`.

### 6. Dry run: simulación sin modificar la base de datos

El _dry run_ permite ejecutar el pipeline completo de preparación de datos sin insertar ni modificar registros en PostgreSQL.

Su funcionamiento es:

1. Leer el CSV.
2. Normalizar los valores.
3. Clasificar los registros.
4. Detectar problemas de validación.
5. Detectar números de factura duplicados.
6. Generar un resumen de los resultados.
7. Registrar los resultados de la simulación.

El objetivo es detectar problemas antes de ejecutar una importación real.

**Garantía principal:** el dry run no realiza escrituras en la base de datos ni modifica su historial.

La detección de facturas duplicadas se incorporó como parte de esta fase de revisión. La primera comprobación utilizaba el número de factura como criterio de detección. No obstante, se identificó que la unicidad definitiva debe evaluarse mediante la combinación de cliente y número de factura, ya que el número por sí solo no constituye necesariamente una clave única global.

Por tanto, dos clientes distintos pueden tener facturas con el mismo número sin que eso implique un duplicado real.

### 7. Logging y trazabilidad

El proceso dispone de un módulo específico, `import-logger.ts`, para centralizar el registro de resultados.

Los resultados del dry run se guardan bajo:

`logs/db`

El registro permite conservar información sobre la ejecución y facilitar la revisión de los problemas encontrados sin tener que repetir manualmente todo el análisis del CSV.

La clasificación y la información de fila son especialmente importantes para localizar los registros que requieren intervención.

El formato exacto de los mensajes, los niveles de logging y la política de rotación de archivos deben consultarse en la implementación actual de `import-logger.ts`; no se consideran aquí especificaciones confirmadas.

### 8. Pruebas

La lectura del CSV y la lógica de simulación se han probado mediante tests automatizados.

Las pruebas del lector verifican el tratamiento de la codificación, los separadores, los caracteres acentuados, las filas vacías y los registros con facturas vacías o repetidas.

Las pruebas del dry run utilizan dependencias simuladas (_mocks_) para comprobar la lógica de procesamiento y registro sin necesitar una conexión real a PostgreSQL.

Esto permite validar el comportamiento de las fases previas a la importación de forma aislada y reproducible.

### 9. Consideraciones de diseño

Las decisiones principales del pipeline responden a estos criterios:

- **Separación de responsabilidades:** la lectura, normalización, validación e importación se mantienen desacopladas.
- **Conservación de datos:** la lectura no debe descartar silenciosamente registros con información opcional ausente ni eliminar duplicados antes de analizarlos.
- **Validación previa:** los problemas se identifican antes de realizar escrituras en la base de datos.
- **Simulación segura:** el dry run permite evaluar el resultado sin modificar los datos existentes.
- **Trazabilidad:** los resultados se registran para facilitar la revisión y la corrección de incidencias.
- **Reproducibilidad:** el fichero CSV forma parte del repositorio y las rutas utilizadas por los tests no dependen del directorio de trabajo del usuario.
