#!/bin/bash

# Script de despliegue para producción
echo "🚀 Iniciando despliegue de producción..."

# Verificar que estamos en la rama correcta
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    echo "⚠️  No estás en la rama principal. Rama actual: $BRANCH"
    read -p "¿Continuar con el despliegue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Despliegue cancelado"
        exit 1
    fi
fi

# Verificar que no hay cambios sin commit
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Hay cambios sin commit en el repositorio"
    git status --short
    read -p "¿Continuar con el despliegue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Despliegue cancelado"
        exit 1
    fi
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# Verificar tipos
echo "🔍 Verificando tipos TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Error en verificación de tipos"
    exit 1
fi

# Ejecutar linting
echo "🧹 Verificando código..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Error en linting"
    exit 1
fi

# Construir aplicación
echo "🏗️  Construyendo aplicación..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en construcción"
    exit 1
fi

echo "✅ Construcción completada exitosamente!"
echo ""
echo "🎯 Para ejecutar en producción:"
echo "  npm start"
echo ""
echo "🐳 Para desplegar con Docker:"
echo "  docker build -t buestanflow-production ."
echo "  docker run -p 3000:3000 buestanflow-production"
