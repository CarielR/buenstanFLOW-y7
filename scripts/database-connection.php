<?php
/**
 * CONFIGURACIÓN DE CONEXIÓN A BASE DE DATOS - XAMPP
 * Sistema de Producción BUESTANFLOW
 * 
 * Configuración específica para XAMPP con credenciales por defecto
 */

// =====================================================
// CONFIGURACIÓN XAMPP POR DEFECTO
// =====================================================

define('DB_HOST', 'localhost');           // Servidor XAMPP
define('DB_NAME', 'buestanflow_production'); // Nombre de la base de datos
define('DB_USER', 'root');                // Usuario por defecto de XAMPP
define('DB_PASS', '');                    // Sin contraseña por defecto en XAMPP
define('DB_CHARSET', 'utf8mb4');          // Codificación de caracteres
define('DB_PORT', 3306);                  // Puerto MySQL por defecto

// =====================================================
// VERIFICACIÓN DE XAMPP
// =====================================================

/**
 * Verificar si XAMPP está ejecutándose correctamente
 */
function verificarXAMPP() {
    // Verificar si Apache está corriendo
    $apache_running = false;
    if (function_exists('apache_get_version')) {
        $apache_running = true;
    }
    
    // Verificar conexión MySQL
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $mysql_running = true;
    } catch (PDOException $e) {
        $mysql_running = false;
    }
    
    return [
        'apache' => $apache_running,
        'mysql' => $mysql_running
    ];
}

// =====================================================
// CLASE DE CONEXIÓN PDO PARA XAMPP
// =====================================================

class DatabaseConnection {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            // Primero intentar conectar sin especificar base de datos
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=" . DB_CHARSET;
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET,
                PDO::ATTR_TIMEOUT            => 30
            ];
            
            $tempConnection = new PDO($dsn, DB_USER, DB_PASS, $options);
            
            // Verificar si la base de datos existe, si no, crearla
            $stmt = $tempConnection->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([DB_NAME]);
            
            if (!$stmt->fetch()) {
                // Crear la base de datos si no existe
                $tempConnection->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                echo "<div style='background: #d4edda; color: #155724; padding: 10px; margin: 10px 0; border-radius: 5px;'>";
                echo "✅ Base de datos '" . DB_NAME . "' creada exitosamente";
                echo "</div>";
            }
            
            // Ahora conectar a la base de datos específica
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch (PDOException $e) {
            $error_msg = "❌ Error de conexión XAMPP: " . $e->getMessage();
            
            // Mensajes de error específicos para XAMPP
            if (strpos($e->getMessage(), 'Connection refused') !== false) {
                $error_msg .= "\n\n🔧 Soluciones posibles:\n";
                $error_msg .= "1. Asegúrate de que XAMPP esté iniciado\n";
                $error_msg .= "2. Inicia Apache y MySQL desde el panel de control de XAMPP\n";
                $error_msg .= "3. Verifica que el puerto 3306 no esté ocupado\n";
            }
            
            die("<pre style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px;'>" . $error_msg . "</pre>");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    // Prevenir clonación
    private function __clone() {}
    
    // Prevenir deserialización
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// =====================================================
// FUNCIONES DE UTILIDAD PARA XAMPP
// =====================================================

/**
 * Obtener conexión a la base de datos
 * @return PDO
 */
function getDB() {
    return DatabaseConnection::getInstance()->getConnection();
}

/**
 * Ejecutar consulta SELECT
 * @param string $sql
 * @param array $params
 * @return array
 */
function executeQuery($sql, $params = []) {
    try {
        $db = getDB();
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Error en consulta: " . $e->getMessage());
        return false;
    }
}

/**
 * Ejecutar consulta INSERT/UPDATE/DELETE
 * @param string $sql
 * @param array $params
 * @return bool|int
 */
function executeUpdate($sql, $params = []) {
    try {
        $db = getDB();
        $stmt = $db->prepare($sql);
        $result = $stmt->execute($params);
        
        // Retornar ID del último registro insertado si es INSERT
        if (strpos(strtoupper($sql), 'INSERT') === 0) {
            return $db->lastInsertId();
        }
        
        return $stmt->rowCount();
    } catch (PDOException $e) {
        error_log("Error en actualización: " . $e->getMessage());
        return false;
    }
}

// =====================================================
// FUNCIONES ESPECÍFICAS DEL SISTEMA
// =====================================================

/**
 * Obtener todos los pedidos con información completa
 */
function obtenerPedidos() {
    $sql = "SELECT 
                p.id,
                p.cliente_id,
                c.nombre as cliente_nombre,
                p.producto_id,
                pr.nombre as producto_nombre,
                p.cantidad,
                p.estado,
                p.prioridad,
                p.fecha_creacion,
                p.fecha_entrega,
                p.notas,
                p.progreso
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN productos pr ON p.producto_id = pr.id
            ORDER BY p.fecha_creacion DESC";
    return executeQuery($sql);
}

/**
 * Obtener KPIs del dashboard
 */
function obtenerKPIs() {
    try {
        $kpis = [];
        
        // Pedidos en cola
        $result = executeQuery("SELECT COUNT(*) as count FROM pedidos WHERE estado = 'en_cola'");
        $kpis['pedidos_en_cola'] = $result[0]['count'] ?? 0;
        
        // Pedidos en proceso
        $result = executeQuery("SELECT COUNT(*) as count FROM pedidos WHERE estado = 'en_proceso'");
        $kpis['pedidos_en_proceso'] = $result[0]['count'] ?? 0;
        
        // Pedidos finalizados hoy
        $result = executeQuery("SELECT COUNT(*) as count FROM pedidos WHERE estado = 'finalizado' AND DATE(fecha_actualizacion) = CURDATE()");
        $kpis['pedidos_finalizados_hoy'] = $result[0]['count'] ?? 0;
        
        // Unidades en proceso
        $result = executeQuery("SELECT SUM(cantidad) as total FROM pedidos WHERE estado IN ('en_proceso', 'en_cola')");
        $kpis['unidades_en_proceso'] = $result[0]['total'] ?? 0;
        
        // Insumos con stock bajo
        $result = executeQuery("SELECT COUNT(*) as count FROM insumos WHERE cantidad_actual <= stock_minimo");
        $kpis['insumos_stock_bajo'] = $result[0]['count'] ?? 0;
        
        return $kpis;
    } catch (Exception $e) {
        error_log("Error obteniendo KPIs: " . $e->getMessage());
        return [
            'pedidos_en_cola' => 0,
            'pedidos_en_proceso' => 0,
            'pedidos_finalizados_hoy' => 0,
            'unidades_en_proceso' => 0,
            'insumos_stock_bajo' => 0
        ];
    }
}

/**
 * Obtener insumos con stock bajo
 */
function obtenerStockBajo() {
    $sql = "SELECT 
                id,
                nombre,
                cantidad_actual,
                stock_minimo,
                unidad_medida,
                (stock_minimo - cantidad_actual) as cantidad_faltante
            FROM insumos 
            WHERE cantidad_actual <= stock_minimo 
            ORDER BY cantidad_faltante DESC";
    return executeQuery($sql);
}

// =====================================================
// TESTING ESPECÍFICO PARA XAMPP
// =====================================================

/**
 * Función para probar la conexión XAMPP
 */
function testConnectionXAMPP() {
    echo "<div style='font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px;'>";
    echo "<h2>🔧 Test de Conexión XAMPP - BUESTANFLOW</h2>";
    
    // Verificar servicios XAMPP
    $services = verificarXAMPP();
    
    echo "<h3>📋 Estado de Servicios XAMPP:</h3>";
    echo "<ul>";
    echo "<li>Apache: " . ($services['apache'] ? "✅ Ejecutándose" : "❌ No detectado") . "</li>";
    echo "<li>MySQL: " . ($services['mysql'] ? "✅ Conectado" : "❌ No conectado") . "</li>";
    echo "</ul>";
    
    if (!$services['mysql']) {
        echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0;'>";
        echo "<h4>❌ MySQL no está disponible</h4>";
        echo "<p><strong>Pasos para solucionar:</strong></p>";
        echo "<ol>";
        echo "<li>Abre el Panel de Control de XAMPP</li>";
        echo "<li>Haz clic en 'Start' junto a Apache</li>";
        echo "<li>Haz clic en 'Start' junto a MySQL</li>";
        echo "<li>Espera a que ambos servicios muestren 'Running'</li>";
        echo "<li>Recarga esta página</li>";
        echo "</ol>";
        echo "</div>";
        return;
    }
    
    try {
        $db = getDB();
        
        echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0;'>";
        echo "<h4>✅ Conexión Exitosa</h4>";
        echo "<p>Conectado a MySQL en XAMPP correctamente</p>";
        echo "</div>";
        
        // Verificar si las tablas existen
        $tables = executeQuery("SHOW TABLES");
        
        if (empty($tables)) {
            echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0;'>";
            echo "<h4>⚠️ Base de datos vacía</h4>";
            echo "<p>La base de datos existe pero no tiene tablas.</p>";
            echo "<p><strong>Siguiente paso:</strong> Ejecuta el script 'database-setup.sql' en phpMyAdmin</p>";
            echo "<p><strong>URL phpMyAdmin:</strong> <a href='http://localhost/phpmyadmin' target='_blank'>http://localhost/phpmyadmin</a></p>";
            echo "</div>";
        } else {
            echo "<h4>📊 Tablas encontradas:</h4>";
            echo "<ul>";
            foreach ($tables as $table) {
                $tableName = array_values($table)[0];
                echo "<li>✅ " . $tableName . "</li>";
            }
            echo "</ul>";
            
            // Probar KPIs si las tablas existen
            $kpis = obtenerKPIs();
            if ($kpis) {
                echo "<h4>📈 KPIs del Sistema:</h4>";
                echo "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0;'>";
                
                $kpi_items = [
                    ['label' => 'Pedidos en Cola', 'value' => $kpis['pedidos_en_cola'], 'color' => '#ffc107'],
                    ['label' => 'En Proceso', 'value' => $kpis['pedidos_en_proceso'], 'color' => '#17a2b8'],
                    ['label' => 'Finalizados Hoy', 'value' => $kpis['pedidos_finalizados_hoy'], 'color' => '#28a745'],
                    ['label' => 'Unidades en Proceso', 'value' => $kpis['unidades_en_proceso'], 'color' => '#6f42c1'],
                    ['label' => 'Stock Bajo', 'value' => $kpis['insumos_stock_bajo'], 'color' => '#dc3545']
                ];
                
                foreach ($kpi_items as $kpi) {
                    echo "<div style='background: white; border-left: 4px solid {$kpi['color']}; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
                    echo "<div style='font-size: 24px; font-weight: bold; color: {$kpi['color']};'>{$kpi['value']}</div>";
                    echo "<div style='color: #666; font-size: 14px;'>{$kpi['label']}</div>";
                    echo "</div>";
                }
                
                echo "</div>";
            }
        }
        
        // Información de conexión
        echo "<h4>🔗 Información de Conexión:</h4>";
        echo "<ul>";
        echo "<li><strong>Host:</strong> " . DB_HOST . "</li>";
        echo "<li><strong>Puerto:</strong> " . DB_PORT . "</li>";
        echo "<li><strong>Base de datos:</strong> " . DB_NAME . "</li>";
        echo "<li><strong>Usuario:</strong> " . DB_USER . "</li>";
        echo "<li><strong>Charset:</strong> " . DB_CHARSET . "</li>";
        echo "</ul>";
        
        echo "<h4>🌐 Enlaces útiles:</h4>";
        echo "<ul>";
        echo "<li><a href='http://localhost/phpmyadmin' target='_blank'>phpMyAdmin</a></li>";
        echo "<li><a href='http://localhost/dashboard' target='_blank'>XAMPP Dashboard</a></li>";
        echo "</ul>";
        
    } catch (Exception $e) {
        echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0;'>";
        echo "<h4>❌ Error de Conexión</h4>";
        echo "<p>" . $e->getMessage() . "</p>";
        echo "</div>";
    }
    
    echo "</div>";
}

// =====================================================
// CONFIGURACIÓN DE ZONA HORARIA Y ERRORES
// =====================================================

date_default_timezone_set('America/Bogota');
error_reporting(E_ALL);
ini_set('display_errors', 1); // Mostrar errores en desarrollo con XAMPP
ini_set('log_errors', 1);

// =====================================================
// AUTO-TEST (Descomenta para probar)
// =====================================================

// Descomenta la siguiente línea para probar la conexión automáticamente
// testConnectionXAMPP();

?>
