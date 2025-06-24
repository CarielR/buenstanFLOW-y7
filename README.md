# Sistema de Producción BUESTANFLOW

Sistema completo de gestión de producción para la empresa BUESTANFLOW, desarrollado con Next.js 14, TypeScript y Tailwind CSS.

## 🚀 Características

### 📊 Panel de Pedidos
- Listado completo de pedidos activos con filas zebra
- KPI Cards dinámicos (Total en cola, En proceso, Finalizados hoy, Tiempo promedio)
- Búsqueda avanzada por código, producto o cliente
- Filtros por estado, prioridad y fecha
- Ordenamiento por todas las columnas
- Paginación con "Cargar más..." en móvil
- Exportación a CSV
- Creación de nuevos pedidos con formulario completo
- Botón de ayuda con diagrama de flujo interactivo

### 🔄 Registro de Estado de Producción
- Contexto detallado del pedido (ID, producto, cantidad, cliente, prioridad)
- Barra de progreso visual de 3 pasos con animaciones
- Botones de estado habilitados según el estado actual
- Historial completo de cambios con filtros
- Navegación por teclado (← → para pedidos, I/F para estados)
- Vista de todos los pedidos o pedido específico
- Paginación en el historial

### 📦 Vista de Insumos Utilizados
- Selector de pedido con navegación
- Tabla editable con validación en tiempo real
- Actualización automática del inventario
- Historial de consumos por pedido
- Validación de stock disponible
- Generación automática de insumos por tipo de producto
- Estados visuales (Error, Completo, Parcial, Pendiente)

## 🛠️ Tecnologías

- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes**: Radix UI + shadcn/ui
- **Iconos**: Lucide React
- **Estado**: React Context API
- **Notificaciones**: Toast system integrado

## 📋 Requisitos Previos

- Node.js 18.0.0 o superior
- npm 8.0.0 o superior

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
\`\`\`bash
git clone <url-del-repositorio>
cd sistema-produccion-buestanflow
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Ejecutar en modo desarrollo
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 4. Construir para producción
\`\`\`bash
npm run build
npm start
\`\`\`

## 📁 Estructura del Proyecto

\`\`\`
├── app/                          # App Router de Next.js
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Panel de Pedidos
│   ├── gestion/
│   │   └── page.tsx            # Registro de Estado
│   └── produccion/
│       └── page.tsx            # Insumos Utilizados
├── components/                   # Componentes reutilizables
│   ├── ui/                      # Componentes de UI (shadcn)
│   ├── production-context.tsx   # Context de producción
│   └── sidebar.tsx              # Navegación lateral
├── hooks/                       # Custom hooks
├── lib/                         # Utilidades
└── public/                      # Archivos estáticos
\`\`\`

## 🎯 Funcionalidades Principales

### Panel de Pedidos (`/`)
- **KPIs Dinámicos**: Se actualizan automáticamente al cambiar estados
- **Filtros Avanzados**: Estado, prioridad, fecha (hoy, semana, mes)
- **Búsqueda**: Por código, producto o cliente
- **Acciones**: Iniciar (En cola → En proceso), Finalizar (En proceso → Finalizado)
- **Nuevo Pedido**: Formulario completo con validación
- **Exportar**: Descarga CSV con datos filtrados
- **Ayuda**: Diagrama de flujo del proceso

### Gestión (`/gestion`)
- **Progreso Visual**: Barra de 3 pasos con animaciones
- **Navegación**: Flechas o teclado para cambiar pedidos
- **Historial**: Todos los cambios con filtros y búsqueda
- **Acciones Rápidas**: Teclas I (Iniciar) y F (Finalizar)

### Producción (`/produccion`)
- **Gestión de Insumos**: Tabla editable con validación
- **Inventario**: Actualización automática al guardar
- **Historial**: Registro de todos los consumos
- **Validación**: No permite exceder stock disponible
- **Estados**: Indicadores visuales del progreso

## 🔧 Scripts Disponibles

\`\`\`bash
npm run dev          # Desarrollo
npm run build        # Construcción para producción
npm start            # Servidor de producción
npm run lint         # Linting
npm run type-check   # Verificación de tipos
\`\`\`

## 📱 Responsive Design

- **Desktop**: Experiencia completa con todas las columnas
- **Tablet**: Sidebar colapsable, columnas adaptativas
- **Mobile**: Navegación optimizada, paginación "Cargar más..."

## 🎨 Tema y Colores

- **Primario**: Rojo (#991b1b) - BUESTANFLOW
- **Secundario**: Naranja (#ea580c) - Acciones
- **Éxito**: Verde (#16a34a) - Completado
- **Fondo**: Piedra (#f5f5f4) - Neutral

## 🔒 Datos

El sistema utiliza datos hardcodeados pero completamente funcionales:
- 5 pedidos de ejemplo con diferentes estados
- Historial completo de cambios
- Insumos específicos por tipo de producto
- KPIs calculados en tiempo real

## 🚀 Despliegue

### Desarrollo Local
\`\`\`bash
npm run dev
\`\`\`

### Producción Local
\`\`\`bash
npm run build
npm start
\`\`\`

### Vercel (Recomendado)
\`\`\`bash
vercel --prod
\`\`\`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a BUESTANFLOW.

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contacta al equipo de desarrollo.

---

**BUESTANFLOW** - Sistema de Producción v1.0.0
