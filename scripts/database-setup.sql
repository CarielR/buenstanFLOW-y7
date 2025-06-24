-- =====================================================
-- SISTEMA DE PRODUCCIÓN BUESTANFLOW
-- Script de Base de Datos MySQL
-- =====================================================

-- Crear la base de datos
DROP DATABASE IF EXISTS buestanflow_production;
CREATE DATABASE buestanflow_production 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE buestanflow_production;

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'supervisor', 'operario', 'cliente') DEFAULT 'operario',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
);

-- =====================================================
-- TABLA: clientes
-- =====================================================
CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Colombia',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_email (email),
    INDEX idx_activo (activo)
);

-- =====================================================
-- TABLA: productos
-- =====================================================
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria ENUM('zapato', 'botin', 'sandalia', 'deportivo', 'formal') NOT NULL,
    precio_base DECIMAL(10,2),
    tiempo_produccion_horas INT DEFAULT 8,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo)
);

-- =====================================================
-- TABLA: insumos
-- =====================================================
CREATE TABLE insumos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad_medida ENUM('kg', 'g', 'l', 'ml', 'm', 'cm', 'u', 'm²', 'cm²') NOT NULL,
    stock_actual DECIMAL(10,3) DEFAULT 0,
    stock_minimo DECIMAL(10,3) DEFAULT 0,
    precio_unitario DECIMAL(10,2),
    proveedor VARCHAR(150),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_stock_minimo (stock_minimo),
    INDEX idx_activo (activo)
);

-- =====================================================
-- TABLA: pedidos
-- =====================================================
CREATE TABLE pedidos (
    id VARCHAR(20) PRIMARY KEY,
    cliente_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    estado ENUM('En cola', 'En proceso', 'Finalizado', 'Cancelado') DEFAULT 'En cola',
    prioridad ENUM('Alta', 'Media', 'Baja') DEFAULT 'Media',
    precio_total DECIMAL(10,2),
    notas TEXT,
    fecha_entrega_estimada DATE,
    fecha_entrega_real DATE,
    usuario_asignado_id INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_estado (estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_cliente (cliente_id),
    INDEX idx_producto (producto_id),
    INDEX idx_fecha_creacion (fecha_creacion),
    INDEX idx_fecha_entrega (fecha_entrega_estimada)
);

-- =====================================================
-- TABLA: historial_estados
-- =====================================================
CREATE TABLE historial_estados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id VARCHAR(20) NOT NULL,
    estado_anterior ENUM('En cola', 'En proceso', 'Finalizado', 'Cancelado'),
    estado_nuevo ENUM('En cola', 'En proceso', 'Finalizado', 'Cancelado') NOT NULL,
    usuario_id INT NOT NULL,
    notas TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    
    INDEX idx_pedido (pedido_id),
    INDEX idx_fecha_cambio (fecha_cambio),
    INDEX idx_estado_nuevo (estado_nuevo)
);

-- =====================================================
-- TABLA: recetas_productos (insumos necesarios por producto)
-- =====================================================
CREATE TABLE recetas_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    insumo_id INT NOT NULL,
    cantidad_necesaria DECIMAL(10,3) NOT NULL,
    es_opcional BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_producto_insumo (producto_id, insumo_id),
    INDEX idx_producto (producto_id),
    INDEX idx_insumo (insumo_id)
);

-- =====================================================
-- TABLA: consumos_insumos
-- =====================================================
CREATE TABLE consumos_insumos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id VARCHAR(20) NOT NULL,
    insumo_id INT NOT NULL,
    cantidad_consumida DECIMAL(10,3) NOT NULL,
    usuario_id INT NOT NULL,
    fecha_consumo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    
    INDEX idx_pedido (pedido_id),
    INDEX idx_insumo (insumo_id),
    INDEX idx_fecha_consumo (fecha_consumo)
);

-- =====================================================
-- TABLA: movimientos_inventario
-- =====================================================
CREATE TABLE movimientos_inventario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    insumo_id INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    stock_anterior DECIMAL(10,3) NOT NULL,
    stock_nuevo DECIMAL(10,3) NOT NULL,
    motivo VARCHAR(255),
    usuario_id INT NOT NULL,
    pedido_id VARCHAR(20) NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    
    INDEX idx_insumo (insumo_id),
    INDEX idx_tipo_movimiento (tipo_movimiento),
    INDEX idx_fecha_movimiento (fecha_movimiento),
    INDEX idx_pedido (pedido_id)
);

-- =====================================================
-- TABLA: configuracion_sistema
-- =====================================================
CREATE TABLE configuracion_sistema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clave (clave)
);

-- =====================================================
-- INSERTAR DATOS INICIALES
-- =====================================================

-- Usuarios iniciales
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@buestanflow.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Juan Operario', 'operario@buestanflow.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operario'),
('María Supervisora', 'supervisor@buestanflow.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor'),
('Luis Técnico', 'tecnico@buestanflow.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operario');

-- Clientes iniciales
INSERT INTO clientes (nombre, email, telefono, direccion, ciudad) VALUES
('Cliente ABC S.A.S', 'contacto@clienteabc.com', '+57 300 123 4567', 'Calle 123 #45-67', 'Bogotá'),
('Cliente XYZ Ltda', 'ventas@clientexyz.com', '+57 301 234 5678', 'Carrera 89 #12-34', 'Medellín'),
('Cliente DEF Corp', 'pedidos@clientedef.com', '+57 302 345 6789', 'Avenida 56 #78-90', 'Cali'),
('Cliente GHI S.A.S', 'compras@clienteghi.com', '+57 303 456 7890', 'Diagonal 34 #56-78', 'Barranquilla'),
('Cliente JKL Ltda', 'comercial@clientejkl.com', '+57 304 567 8901', 'Transversal 12 #34-56', 'Cartagena');

-- Productos iniciales
INSERT INTO productos (nombre, descripcion, categoria, precio_base, tiempo_produccion_horas) VALUES
('Zapato Clásico A', 'Zapato formal de cuero para hombre', 'formal', 150000.00, 8),
('Botín Casual B', 'Botín casual unisex resistente', 'botin', 120000.00, 6),
('Sandalia Deportiva C', 'Sandalia cómoda para actividades', 'sandalia', 80000.00, 4),
('Zapato Deportivo D', 'Zapato deportivo de alto rendimiento', 'deportivo', 180000.00, 10),
('Botín Formal E', 'Botín elegante para ocasiones especiales', 'formal', 200000.00, 12);

-- Insumos iniciales
INSERT INTO insumos (nombre, descripcion, unidad_medida, stock_actual, stock_minimo, precio_unitario, proveedor) VALUES
('Cuero Premium', 'Cuero de alta calidad para calzado formal', 'm²', 50.000, 10.000, 45000.00, 'Curtiembre Nacional'),
('Cuero Sintético', 'Material sintético resistente', 'm²', 75.000, 15.000, 25000.00, 'Sintéticos Colombia'),
('Suela Goma', 'Suela de goma antideslizante', 'u', 200, 50, 8000.00, 'Suelas y Más'),
('Suela Flexible', 'Suela flexible para sandalias', 'u', 150, 30, 6000.00, 'Suelas y Más'),
('Suela Antideslizante', 'Suela especializada deportiva', 'u', 100, 25, 12000.00, 'Deportes Pro'),
('Plantilla Estándar', 'Plantilla básica cómoda', 'u', 500, 100, 2000.00, 'Plantillas Comfort'),
('Plantilla Comfort', 'Plantilla ergonómica premium', 'u', 300, 60, 3500.00, 'Plantillas Comfort'),
('Cordones Clásicos', 'Cordones de algodón tradicionales', 'u', 800, 200, 1500.00, 'Accesorios Ltda'),
('Cordones Deportivos', 'Cordones técnicos deportivos', 'u', 400, 100, 2500.00, 'Deportes Pro'),
('Goma Vulca', 'Adhesivo especializado para calzado', 'kg', 25.000, 5.000, 15000.00, 'Químicos Industriales'),
('Cinta de Tela', 'Refuerzo interno de tela', 'm', 200.000, 50.000, 800.00, 'Textiles Unidos'),
('Correa Ajustable', 'Correa para sandalias ajustables', 'u', 300, 75, 4000.00, 'Accesorios Ltda'),
('Hebilla Metal', 'Hebilla metálica resistente', 'u', 250, 50, 3000.00, 'Metales y Herrajes'),
('Forro Interno', 'Forro suave para botines', 'u', 400, 80, 2800.00, 'Textiles Unidos'),
('Forro Térmico', 'Forro térmico especializado', 'u', 200, 40, 4500.00, 'Textiles Técnicos');

-- Recetas de productos (qué insumos necesita cada producto)
INSERT INTO recetas_productos (producto_id, insumo_id, cantidad_necesaria) VALUES
-- Zapato Clásico A
(1, 1, 0.080), -- Cuero Premium
(1, 3, 1.000), -- Suela Goma
(1, 6, 1.000), -- Plantilla Estándar
(1, 8, 2.000), -- Cordones Clásicos
(1, 10, 0.050), -- Goma Vulca

-- Botín Casual B
(2, 2, 0.100), -- Cuero Sintético
(2, 3, 1.000), -- Suela Goma
(2, 7, 1.000), -- Plantilla Comfort
(2, 14, 1.000), -- Forro Interno
(2, 10, 0.060), -- Goma Vulca

-- Sandalia Deportiva C
(3, 2, 0.040), -- Cuero Sintético
(3, 4, 1.000), -- Suela Flexible
(3, 12, 2.000), -- Correa Ajustable
(3, 13, 1.000), -- Hebilla Metal

-- Zapato Deportivo D
(4, 2, 0.090), -- Cuero Sintético
(4, 5, 1.000), -- Suela Antideslizante
(4, 7, 1.000), -- Plantilla Comfort
(4, 9, 2.000), -- Cordones Deportivos
(4, 10, 0.070), -- Goma Vulca

-- Botín Formal E
(5, 1, 0.120), -- Cuero Premium
(5, 3, 1.000), -- Suela Goma
(5, 7, 1.000), -- Plantilla Comfort
(5, 15, 1.000), -- Forro Térmico
(5, 8, 2.000), -- Cordones Clásicos
(5, 10, 0.080); -- Goma Vulca

-- Pedidos iniciales
INSERT INTO pedidos (id, cliente_id, producto_id, cantidad, estado, prioridad, precio_total, fecha_entrega_estimada, usuario_asignado_id) VALUES
('P1023', 1, 1, 50, 'En cola', 'Alta', 7500000.00, '2025-07-15', 2),
('P1024', 2, 2, 30, 'En proceso', 'Media', 3600000.00, '2025-07-10', 2),
('P1025', 3, 3, 25, 'Finalizado', 'Baja', 2000000.00, '2025-06-25', 4),
('P1026', 4, 1, 40, 'En cola', 'Media', 6000000.00, '2025-07-20', NULL),
('P1027', 5, 5, 35, 'En proceso', 'Alta', 7000000.00, '2025-07-12', 4);

-- Historial de estados
INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, usuario_id, notas) VALUES
('P1023', NULL, 'En cola', 1, 'Pedido creado'),
('P1024', NULL, 'En cola', 1, 'Pedido creado'),
('P1024', 'En cola', 'En proceso', 2, 'Iniciado por operario'),
('P1025', NULL, 'En cola', 1, 'Pedido creado'),
('P1025', 'En cola', 'En proceso', 3, 'Prioridad alta - iniciado por supervisor'),
('P1025', 'En proceso', 'Finalizado', 2, 'Completado exitosamente'),
('P1026', NULL, 'En cola', 1, 'Pedido creado'),
('P1027', NULL, 'En cola', 1, 'Pedido creado'),
('P1027', 'En cola', 'En proceso', 4, 'Iniciado por técnico especializado');

-- Configuración del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo) VALUES
('empresa_nombre', 'BUESTANFLOW', 'Nombre de la empresa', 'string'),
('empresa_direccion', 'Calle Principal #123-45', 'Dirección de la empresa', 'string'),
('empresa_telefono', '+57 300 123 4567', 'Teléfono principal', 'string'),
('empresa_email', 'info@buestanflow.com', 'Email de contacto', 'string'),
('moneda_simbolo', '$', 'Símbolo de la moneda', 'string'),
('moneda_codigo', 'COP', 'Código de la moneda', 'string'),
('timezone', 'America/Bogota', 'Zona horaria del sistema', 'string'),
('backup_automatico', 'true', 'Activar backup automático', 'boolean'),
('notificaciones_email', 'true', 'Enviar notificaciones por email', 'boolean'),
('stock_alerta_dias', '7', 'Días de anticipación para alertas de stock', 'number');

-- =====================================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =====================================================

-- Trigger para actualizar stock cuando se consume un insumo
DELIMITER //
CREATE TRIGGER tr_actualizar_stock_consumo
    AFTER INSERT ON consumos_insumos
    FOR EACH ROW
BEGIN
    DECLARE stock_anterior DECIMAL(10,3);
    
    -- Obtener stock actual
    SELECT stock_actual INTO stock_anterior 
    FROM insumos 
    WHERE id = NEW.insumo_id;
    
    -- Actualizar stock
    UPDATE insumos 
    SET stock_actual = stock_actual - NEW.cantidad_consumida,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = NEW.insumo_id;
    
    -- Registrar movimiento de inventario
    INSERT INTO movimientos_inventario 
    (insumo_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id, pedido_id)
    VALUES 
    (NEW.insumo_id, 'salida', NEW.cantidad_consumida, stock_anterior, 
     stock_anterior - NEW.cantidad_consumida, 'Consumo en producción', NEW.usuario_id, NEW.pedido_id);
END//
DELIMITER ;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de pedidos con información completa
CREATE VIEW vista_pedidos_completa AS
SELECT 
    p.id,
    p.cantidad,
    p.estado,
    p.prioridad,
    p.precio_total,
    p.fecha_creacion,
    p.fecha_entrega_estimada,
    c.nombre AS cliente_nombre,
    c.email AS cliente_email,
    pr.nombre AS producto_nombre,
    pr.categoria AS producto_categoria,
    u.nombre AS usuario_asignado,
    DATEDIFF(p.fecha_entrega_estimada, CURDATE()) AS dias_para_entrega
FROM pedidos p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN productos pr ON p.producto_id = pr.id
LEFT JOIN usuarios u ON p.usuario_asignado_id = u.id;

-- Vista de stock bajo
CREATE VIEW vista_stock_bajo AS
SELECT 
    i.id,
    i.nombre,
    i.stock_actual,
    i.stock_minimo,
    i.unidad_medida,
    i.proveedor,
    (i.stock_minimo - i.stock_actual) AS cantidad_faltante
FROM insumos i
WHERE i.stock_actual <= i.stock_minimo
AND i.activo = TRUE;

-- Vista de KPIs
CREATE VIEW vista_kpis AS
SELECT 
    (SELECT COUNT(*) FROM pedidos WHERE estado = 'En cola') AS pedidos_en_cola,
    (SELECT COUNT(*) FROM pedidos WHERE estado = 'En proceso') AS pedidos_en_proceso,
    (SELECT COUNT(*) FROM pedidos WHERE estado = 'Finalizado' AND DATE(fecha_actualizacion) = CURDATE()) AS pedidos_finalizados_hoy,
    (SELECT SUM(cantidad) FROM pedidos WHERE estado = 'En proceso') AS unidades_en_proceso,
    (SELECT COUNT(*) FROM insumos WHERE stock_actual <= stock_minimo) AS insumos_stock_bajo;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =====================================================

-- Procedimiento para crear un nuevo pedido
DELIMITER //
CREATE PROCEDURE sp_crear_pedido(
    IN p_id VARCHAR(20),
    IN p_cliente_id INT,
    IN p_producto_id INT,
    IN p_cantidad INT,
    IN p_prioridad ENUM('Alta', 'Media', 'Baja'),
    IN p_fecha_entrega DATE,
    IN p_notas TEXT,
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_precio_base DECIMAL(10,2);
    DECLARE v_precio_total DECIMAL(10,2);
    
    -- Obtener precio del producto
    SELECT precio_base INTO v_precio_base 
    FROM productos 
    WHERE id = p_producto_id;
    
    SET v_precio_total = v_precio_base * p_cantidad;
    
    -- Insertar pedido
    INSERT INTO pedidos (id, cliente_id, producto_id, cantidad, prioridad, precio_total, fecha_entrega_estimada, notas)
    VALUES (p_id, p_cliente_id, p_producto_id, p_cantidad, p_prioridad, v_precio_total, p_fecha_entrega, p_notas);
    
    -- Registrar en historial
    INSERT INTO historial_estados (pedido_id, estado_nuevo, usuario_id, notas)
    VALUES (p_id, 'En cola', p_usuario_id, 'Pedido creado');
    
END//
DELIMITER ;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_pedidos_estado_fecha ON pedidos(estado, fecha_creacion);
CREATE INDEX idx_pedidos_cliente_estado ON pedidos(cliente_id, estado);
CREATE INDEX idx_historial_pedido_fecha ON historial_estados(pedido_id, fecha_cambio);
CREATE INDEX idx_consumos_fecha_insumo ON consumos_insumos(fecha_consumo, insumo_id);
CREATE INDEX idx_movimientos_fecha_tipo ON movimientos_inventario(fecha_movimiento, tipo_movimiento);

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
