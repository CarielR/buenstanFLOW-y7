#!/bin/bash

# Script de configuración inicial para el proyecto
echo "🚀 Configurando Sistema de Producción BUESTANFLOW..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ desde https://nodejs.org/"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Se requiere Node.js 18 o superior. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivo de entorno si no existe
if [ ! -f .env.local ]; then
    echo "📝 Creando archivo de configuración local..."
    cp .env.example .env.local
fi

# Verificar instalación
echo "🔍 Verificando instalación..."
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ Configuración completada exitosamente!"
    echo ""
    echo "🎯 Comandos disponibles:"
    echo "  npm run dev      - Ejecutar en modo desarrollo"
    echo "  npm run build    - Construir para producción"
    echo "  npm run start    - Ejecutar en modo producción"
    echo "  npm run lint     - Verificar código"
    echo ""
    echo "🌐 Para iniciar el servidor de desarrollo:"
    echo "  npm run dev"
    echo ""
    echo "📖 La aplicación estará disponible en http://localhost:3000"
else
    echo "❌ Error en la configuración. Revisa los errores anteriores."
    exit 1
fi
