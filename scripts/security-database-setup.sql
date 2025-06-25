-- Crear tablas de seguridad y autenticación
USE buestanflow_production;

-- Tabla de roles del sistema
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de permisos del sistema
CREATE TABLE IF NOT EXISTS permisos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de permisos por rol
CREATE TABLE IF NOT EXISTS rol_permisos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rol_permiso (rol_id, permiso_id)
);

-- Actualizar tabla de usuarios con campos de seguridad
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS rol_id INT,
ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS intentos_fallidos INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS token_reset VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS token_reset_expira TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
ADD FOREIGN KEY (rol_id) REFERENCES roles(id);

-- Tabla de sesiones activas
CREATE TABLE IF NOT EXISTS sesiones_activas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_usuario_activa (usuario_id, activa)
);

-- Tabla de auditoría de acciones
CREATE TABLE IF NOT EXISTS auditoria_acciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario_fecha (usuario_id, fecha_accion),
    INDEX idx_modulo_fecha (modulo, fecha_accion)
);

-- Insertar roles básicos
INSERT IGNORE INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso completo al sistema'),
('Supervisor', 'Gestión de producción y reportes'),
('Operario', 'Operaciones de producción básicas'),
('Cliente', 'Acceso limitado para consulta de pedidos');

-- Insertar permisos básicos
INSERT IGNORE INTO permisos (nombre, descripcion, modulo, accion) VALUES
-- Gestión de usuarios
('usuarios.crear', 'Crear nuevos usuarios', 'usuarios', 'crear'),
('usuarios.leer', 'Ver información de usuarios', 'usuarios', 'leer'),
('usuarios.actualizar', 'Modificar usuarios existentes', 'usuarios', 'actualizar'),
('usuarios.eliminar', 'Eliminar usuarios', 'usuarios', 'eliminar'),

-- Gestión de pedidos
('pedidos.crear', 'Crear nuevos pedidos', 'pedidos', 'crear'),
('pedidos.leer', 'Ver pedidos', 'pedidos', 'leer'),
('pedidos.actualizar', 'Modificar pedidos', 'pedidos', 'actualizar'),
('pedidos.eliminar', 'Eliminar pedidos', 'pedidos', 'eliminar'),
('pedidos.cambiar_estado', 'Cambiar estado de pedidos', 'pedidos', 'cambiar_estado'),

-- Gestión de producción
('produccion.leer', 'Ver información de producción', 'produccion', 'leer'),
('produccion.gestionar', 'Gestionar procesos de producción', 'produccion', 'gestionar'),
('produccion.consumir_insumos', 'Registrar consumo de insumos', 'produccion', 'consumir_insumos'),

-- Gestión de inventario
('inventario.leer', 'Ver inventario', 'inventario', 'leer'),
('inventario.actualizar', 'Modificar inventario', 'inventario', 'actualizar'),
('inventario.gestionar', 'Gestión completa de inventario', 'inventario', 'gestionar'),

-- Reportes y análisis
('reportes.leer', 'Ver reportes básicos', 'reportes', 'leer'),
('reportes.avanzados', 'Ver reportes avanzados', 'reportes', 'avanzados'),
('reportes.exportar', 'Exportar reportes', 'reportes', 'exportar'),

-- Configuración del sistema
('configuracion.leer', 'Ver configuración', 'configuracion', 'leer'),
('configuracion.actualizar', 'Modificar configuración', 'configuracion', 'actualizar'),

-- Auditoría
('auditoria.leer', 'Ver logs de auditoría', 'auditoria', 'leer');

-- Asignar permisos a roles
-- Administrador: todos los permisos
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'Administrador';

-- Supervisor: permisos de gestión sin administración de usuarios
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'Supervisor' 
AND p.nombre IN (
    'pedidos.crear', 'pedidos.leer', 'pedidos.actualizar', 'pedidos.cambiar_estado',
    'produccion.leer', 'produccion.gestionar', 'produccion.consumir_insumos',
    'inventario.leer', 'inventario.actualizar', 'inventario.gestionar',
    'reportes.leer', 'reportes.avanzados', 'reportes.exportar',
    'configuracion.leer'
);

-- Operario: permisos básicos de producción
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'Operario' 
AND p.nombre IN (
    'pedidos.leer', 'pedidos.cambiar_estado',
    'produccion.leer', 'produccion.consumir_insumos',
    'inventario.leer',
    'reportes.leer'
);

-- Cliente: solo lectura de sus pedidos
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'Cliente' 
AND p.nombre IN ('pedidos.leer');

-- Crear usuario administrador por defecto
INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol_id, activo) 
SELECT 'Administrador', 'admin@buestanflow.com', '$2b$12$LQv3c1yqBwEHFgA7Aw8Ej.LQv3c1yqBwEHFgA7Aw8Ej.LQv3c1yqBw', r.id, TRUE
FROM roles r WHERE r.nombre = 'Administrador';

-- Actualizar usuarios existentes con roles
UPDATE usuarios SET rol_id = (SELECT id FROM roles WHERE nombre = 'Operario' LIMIT 1) 
WHERE rol_id IS NULL AND nombre != 'Administrador';

COMMIT;
