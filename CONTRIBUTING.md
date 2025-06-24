# Guía de Contribución - BUESTANFLOW

## 🚀 Cómo Contribuir

### 1. Fork del Repositorio
\`\`\`bash
# Clonar tu fork
git clone https://github.com/tu-usuario/buenstanFLOW.git
cd buenstanFLOW
\`\`\`

### 2. Configurar el Repositorio Original
\`\`\`bash
# Agregar upstream
git remote add upstream https://github.com/CarielR/buenstanFLOW.git

# Verificar remotos
git remote -v
\`\`\`

### 3. Crear una Rama para tu Feature
\`\`\`bash
# Crear y cambiar a nueva rama
git checkout -b feature/nueva-funcionalidad

# O para un bugfix
git checkout -b fix/corregir-error
\`\`\`

### 4. Realizar Cambios
- Sigue las convenciones de código del proyecto
- Usa TypeScript estricto
- Mantén la consistencia con shadcn/ui
- Asegúrate de que sea responsive

### 5. Commit y Push
\`\`\`bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: agregar nueva funcionalidad de reportes"

# Push a tu fork
git push origin feature/nueva-funcionalidad
\`\`\`

### 6. Crear Pull Request
1. Ve a GitHub y crea un Pull Request
2. Describe claramente los cambios
3. Incluye screenshots si hay cambios visuales
4. Espera la revisión

## 📝 Convenciones de Commit

### Tipos de Commit:
- `feat:` Nueva funcionalidad
- `fix:` Corrección de errores
- `docs:` Documentación
- `style:` Cambios de formato
- `refactor:` Refactorización
- `test:` Pruebas
- `chore:` Tareas de mantenimiento

### Ejemplos:
\`\`\`
feat: agregar filtro por fecha en panel de pedidos
fix: corregir validación de insumos
docs: actualizar README con instrucciones de instalación
style: mejorar espaciado en componente de KPIs
refactor: optimizar contexto de producción
\`\`\`

## 🧪 Testing

\`\`\`bash
# Verificar tipos
npm run type-check

# Linting
npm run lint

# Build
npm run build
\`\`\`

## 📱 Responsive Testing

Asegúrate de probar en:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)
- Large Desktop (1440px+)

## 🎨 Estilo de Código

- Usa TypeScript estricto
- Componentes funcionales con hooks
- Props tipadas con interfaces
- Nombres descriptivos en español para el dominio
- Comentarios en español
- Código en inglés

## 🔧 Estructura de Archivos

\`\`\`
components/
├── ui/           # Componentes shadcn/ui
├── forms/        # Formularios específicos
├── tables/       # Componentes de tabla
└── layout/       # Componentes de layout

app/
├── (dashboard)/  # Rutas del dashboard
├── api/          # API routes
└── globals.css   # Estilos globales
\`\`\`

## 🚨 Reportar Issues

Al reportar un bug, incluye:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
- Información del navegador/dispositivo

## 📞 Contacto

Para dudas sobre contribuciones:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
