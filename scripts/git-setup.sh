#!/bin/bash

echo "🚀 Configurando conexión con GitHub..."

# Verificar si git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado. Instálalo desde https://git-scm.com/"
    exit 1
fi

# Configurar git si es necesario (reemplaza con tus datos)
echo "📝 Configurando usuario Git..."
git config --global user.name "CarielR"
git config --global user.email "tu-email@ejemplo.com"

# Inicializar repositorio git
echo "🔧 Inicializando repositorio..."
git init

# Agregar todos los archivos
echo "📁 Agregando archivos..."
git add .

# Crear commit inicial
echo "💾 Creando commit inicial..."
git commit -m "feat: Sistema de Producción BUESTANFLOW v1.0.0

✨ Características principales:
- Panel de pedidos con KPIs dinámicos y filtros avanzados
- Gestión completa de estados de producción con progreso visual
- Control detallado de insumos utilizados con validación
- Sidebar colapsable y completamente responsive
- Interfaz moderna con shadcn/ui y Tailwind CSS
- Sistema de notificaciones integrado
- Exportación de datos a CSV
- Navegación por teclado y accesibilidad

🛠️ Tecnologías:
- Next.js 14 con App Router
- TypeScript
- Tailwind CSS
- Radix UI + shadcn/ui
- React Context API

📱 Responsive Design:
- Mobile First
- Sidebar adaptativa
- Tablas responsivas
- Componentes optimizados para todos los dispositivos"

# Configurar rama principal
echo "🌿 Configurando rama principal..."
git branch -M main

# Agregar repositorio remoto
echo "🔗 Conectando con GitHub..."
git remote add origin https://github.com/CarielR/buenstanFLOW.git

# Subir código a GitHub
echo "⬆️ Subiendo código a GitHub..."
git push -u origin main

echo "✅ ¡Proyecto conectado exitosamente a GitHub!"
echo "🌐 Repositorio disponible en: https://github.com/CarielR/buenstanFLOW"
