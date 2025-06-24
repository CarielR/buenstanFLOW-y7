# 📋 INSTRUCCIONES DE INSTALACIÓN DE BASE DE DATOS

## 🚀 Configuración Rápida

### 1. **Crear la Base de Datos**
\`\`\`sql
-- Ejecutar en phpMyAdmin o MySQL Workbench
SOURCE database-setup.sql;
\`\`\`

### 2. **Configurar Conexión PHP**
\`\`\`php
// Editar database-connection.php
define('DB_HOST', 'localhost');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_contraseña');
\`\`\`

### 3. **Probar Conexión**
\`\`\`php
// Descomentar en database-connection.php
testConnection();
\`\`\`

## 📊 **Estructura de la Base de Datos**

### **Tablas Principales:**
- `usuarios` - Gestión de usuarios del sistema
- `clientes` - Información de clientes
- `productos` - Catálogo de productos
- `pedidos` - Órdenes de producción
- `insumos` - Inventario de materiales
- `historial_estados` - Seguimiento de cambios

### **Tablas de Relación:**
- `recetas_productos` - Insumos necesarios por producto
- `consumos_insumos` - Registro de consumos
- `movimientos_inventario` - Historial de inventario

### **Vistas Útiles:**
- `vista_pedidos_completa` - Pedidos con toda la información
- `vista_stock_bajo` - Insumos que necesitan reposición
- `vista_kpis` - Métricas del dashboard

## 🔧 **Procedimientos Almacenados**
- `sp_crear_pedido()` - Crear pedido completo con validaciones

## 🛡️ **Características de Seguridad**
- Triggers automáticos para inventario
- Validaciones de integridad referencial
- Índices optimizados para rendimiento
- Conexión PDO con prepared statements

## 📈 **Datos de Prueba Incluidos**
- 4 usuarios (admin, operarios, supervisor)
- 5 clientes de ejemplo
- 5 productos diferentes
- 15 insumos con stock
- 5 pedidos de prueba
- Historial de estados completo

## 🔗 **Cadenas de Conexión**

### **Para phpMyAdmin:**
\`\`\`
Servidor: localhost
Usuario: root
Contraseña: (tu contraseña)
Base de datos: buestanflow_production
\`\`\`

### **Para aplicaciones PHP:**
\`\`\`php
$dsn = "mysql:host=localhost;dbname=buestanflow_production;charset=utf8mb4";
$pdo = new PDO($dsn, $username, $password);
\`\`\`

### **Para Next.js (si usas MySQL2):**
\`\`\`javascript
const mysql = require('mysql2/promise');
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'tu_contraseña',
  database: 'buestanflow_production'
});
