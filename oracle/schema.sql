-- =====================================================================
-- ESQUEMA: Panel de Administración Unificado (Oracle XE)
-- Ejecutar conectado como el usuario de tu esquema (ej. SYSTEM o un user propio)
-- En SQL*Plus o SQL Developer: @schema.sql
-- =====================================================================

-- Limpieza (opcional, comentar si es la primera vez que corres esto)
-- DROP TABLE movimientos;
-- DROP TABLE stock;
-- DROP TABLE usuarios;
-- DROP SEQUENCE seq_movimientos;

-- ---------------------------------------------------------------------
-- Tabla: usuarios
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR2(100) NOT NULL,
    email          VARCHAR2(150) UNIQUE NOT NULL,
    password_hash  VARCHAR2(255),              -- hash bcrypt, NUNCA la contraseña en texto plano
    rol            VARCHAR2(30)  NOT NULL CHECK (rol IN ('ADMINISTRADOR', 'DISTRIBUIDOR', 'VENDEDOR')),
    fcm_token      VARCHAR2(255),              -- token del dispositivo para notificaciones push
    fecha_creado   TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabla: stock (inventario actual)
-- ---------------------------------------------------------------------
CREATE TABLE stock (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    producto      VARCHAR2(150) NOT NULL,
    cantidad      NUMBER DEFAULT 0 NOT NULL,
    unidad        VARCHAR2(20) DEFAULT 'unidad',
    fecha_update  TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabla: movimientos (histórico, INSERT-only, fuente de verdad transaccional)
-- ---------------------------------------------------------------------
CREATE TABLE movimientos (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stock_id      NUMBER NOT NULL,
    usuario_id    NUMBER,
    tipo          VARCHAR2(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
    cantidad      NUMBER NOT NULL,
    rol           VARCHAR2(30) NOT NULL,
    fecha         TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT fk_mov_stock    FOREIGN KEY (stock_id)   REFERENCES stock(id),
    CONSTRAINT fk_mov_usuario  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------
-- Datos de ejemplo para poder probar de inmediato
-- (password_hash queda NULL aqui a proposito: bcrypt no se puede generar
--  en SQL puro. Para que estos usuarios puedan iniciar sesion, registralos
--  con contraseña real via POST /api/auth/register, que genera el hash.)
-- ---------------------------------------------------------------------
INSERT INTO usuarios (nombre, email, rol) VALUES ('Admin Principal', 'admin@empresa.com', 'ADMINISTRADOR');
INSERT INTO usuarios (nombre, email, rol) VALUES ('Juan Distribuidor', 'juan@empresa.com', 'DISTRIBUIDOR');

INSERT INTO stock (producto, cantidad, unidad) VALUES ('Componentes Electronicos (Kit ICE)', 50, 'unidad');
INSERT INTO stock (producto, cantidad, unidad) VALUES ('Microcontrolador ATmega328', 120, 'unidad');
INSERT INTO stock (producto, cantidad, unidad) VALUES ('Tarjetas PCB Prototipo', 80, 'unidad');

COMMIT;

-- Verificación rápida
SELECT * FROM usuarios;
SELECT * FROM stock;
