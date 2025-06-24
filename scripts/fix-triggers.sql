-- =====================================================
-- ARREGLAR TRIGGERS Y CONSUMO DE INSUMOS
-- =====================================================

USE buestanflow_production;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS tr_actualizar_stock_consumo;

-- Crear trigger correcto para la tabla consumos_insumos
DELIMITER //
CREATE TRIGGER tr_actualizar_stock_consumos
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

-- Verificar que el trigger se creó correctamente
SHOW TRIGGERS LIKE 'consumos_insumos';
