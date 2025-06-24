# 🚀 Guía de Configuración XAMPP para BUESTANFLOW

## 📋 Pasos para configurar el proyecto con XAMPP

### 1. **Verificar XAMPP**
- Abre el **Panel de Control de XAMPP**
- Inicia **Apache** (debe mostrar "Running" en verde)
- Inicia **MySQL** (debe mostrar "Running" en verde)

### 2. **Crear la Base de Datos**
1. Ve a **phpMyAdmin**: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. Haz clic en **"Nueva"** en el panel izquierdo
3. Nombre de la base de datos: `buestanflow_production`
4. Cotejamiento: `utf8mb4_unicode_ci`
5. Haz clic en **"Crear"**

### 3. **Importar las Tablas**
1. Selecciona la base de datos `buestanflow_production`
2. Haz clic en la pestaña **"Importar"**
3. Selecciona el archivo `database-setup.sql`
4. Haz clic en **"Continuar"**

### 4. **Probar la Conexión**
1. Crea un archivo `test.php` en `C:\xampp\htdocs\`
2. Copia el contenido de `database-connection.php`
3. Al final del archivo, descomenta: `testConnectionXAMPP();`
4. Ve a: [http://localhost/test.php](http://localhost/test.php)

### 5. **Configuración Verificada**
Si todo está correcto, deberías ver:
- ✅ Apache: Ejecutándose
- ✅ MySQL: Conectado
- ✅ Base de datos creada
- ✅ Tablas importadas
- ✅ KPIs funcionando

## 🔧 Solución de Problemas Comunes

### **Error: "Connection refused"**
- Verifica que MySQL esté iniciado en XAMPP
- Revisa que el puerto 3306 no esté ocupado
- Reinicia los servicios de XAMPP

### **Error: "Access denied"**
- Las credenciales por defecto de XAMPP son:
  - Usuario: `root`
  - Contraseña: *(vacía)*

### **Error: "Database doesn't exist"**
- Crea manualmente la base de datos en phpMyAdmin
- Nombre exacto: `buestanflow_production`

### **Tablas no aparecen**
- Verifica que el archivo SQL se importó correctamente
- Revisa la pestaña "Estructura" en phpMyAdmin
- Re-ejecuta el script `database-setup.sql`

## 📁 Estructura de Archivos Recomendada

\`\`\`
C:\xampp\htdocs\buestanflow\
├── database-connection.php
├── database-setup.sql
├── test.php
└── api\
    ├── pedidos.php
    ├── clientes.php
    └── productos.php
\`\`\`

## 🌐 URLs Importantes

- **phpMyAdmin**: http://localhost/phpmyadmin
- **XAMPP Dashboard**: http://localhost/dashboard
- **Test de Conexión**: http://localhost/buestanflow/test.php

## ⚡ Comandos Útiles

### **Backup de la Base de Datos**
\`\`\`bash
# Desde la línea de comandos
cd C:\xampp\mysql\bin
mysqldump -u root buestanflow_production > backup.sql
\`\`\`

### **Restaurar Base de Datos**
\`\`\`bash
# Desde la línea de comandos
cd C:\xampp\mysql\bin
mysql -u root buestanflow_production < backup.sql
\`\`\`

## 🔒 Configuración de Seguridad (Opcional)

Para mayor seguridad en desarrollo:

1. **Cambiar contraseña de root**:
   - Ve a phpMyAdmin → Cuentas de usuario
   - Edita el usuario `root`
   - Establece una contraseña
   - Actualiza `DB_PASS` en `database-connection.php`

2. **Crear usuario específico**:
   \`\`\`sql
   CREATE USER 'buestanflow'@'localhost' IDENTIFIED BY 'tu_contraseña';
   GRANT ALL PRIVILEGES ON buestanflow_production.* TO 'buestanflow'@'localhost';
   FLUSH PRIVILEGES;
   \`\`\`

## 📞 Soporte

Si tienes problemas:
1. Verifica que XAMPP esté actualizado
2. Revisa los logs de error en `C:\xampp\apache\logs\error.log`
3. Consulta la documentación oficial de XAMPP
