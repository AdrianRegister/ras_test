
BEGIN;

-- 1. Create the normalized status table.
CREATE TABLE estados (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE
);

-- 2. Insert the permitted initial statuses.
INSERT INTO estados (nombre)
VALUES ('Activo'), ('Inactivo');

-- 3. Add the new foreign-key column.
ALTER TABLE clientes
ADD COLUMN estado_id BIGINT;

-- 4. Migrate any existing status values.
UPDATE clientes c
SET estado_id = e.id
FROM estados e
WHERE LOWER(TRIM(c.estado)) = LOWER(e.nombre);

-- 5. Require every client to have a valid status.
ALTER TABLE clientes
ALTER COLUMN estado_id SET NOT NULL;

ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_estado
FOREIGN KEY (estado_id)
REFERENCES estados(id)
ON DELETE RESTRICT;

-- 6. Remove the old text-based status column.
ALTER TABLE clientes
DROP COLUMN estado;

-- 7. Index the foreign key for filtering.
CREATE INDEX idx_clientes_estado_id
ON clientes (estado_id);

COMMIT;
