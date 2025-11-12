# Módulo de Gestión de Tareas - Task Manager

## 📋 Descripción

Sistema completo de gestión de tareas tipo **Tablero Kanban** integrado con el API backend `tasks_api`. Permite crear, editar, visualizar y gestionar tareas con seguimiento de progreso, prioridades, asignaciones y comentarios en tiempo real.

## 🎯 Funcionalidades Principales

### ✅ Tablero Kanban Interactivo
- **3 Columnas**: Por Hacer (TODO), En Progreso (IN_PROGRESS), Completadas (DONE)
- **Drag & Drop**: Arrastra tareas entre columnas para cambiar su estado automáticamente
- **Actualización en tiempo real**: Los cambios se guardan inmediatamente en el backend
- **Tarjetas informativas**: Cada tarea muestra:
  - Título y descripción
  - Prioridad (Baja, Media, Alta, Urgente) con código de colores
  - Fecha de vencimiento
  - Responsable asignado
  - Barra de progreso (0-100%)
  - Indicadores visuales de estado

### 📊 KPIs y Estadísticas
- Contador de tareas por columna
- Total de tareas en el sistema
- Visualización gráfica con iconos y colores distintivos

### ➕ Creación y Edición de Tareas
Formulario completo con todos los campos:
- **Información Básica**:
  - Título (requerido)
  - Descripción detallada
  - Proyecto/Iniciativa asociada
  
- **Asignación**:
  - Nombre del responsable
  - Fecha de vencimiento
  
- **Configuración**:
  - Prioridad: LOW, MEDIUM, HIGH, URGENT
  - Estado: TODO, IN_PROGRESS, DONE, CANCELLED
  - Progreso: Slider de 0-100% con vista previa visual

- **Validaciones**: Campos requeridos con mensajes de error
- **Notificaciones**: SweetAlert2 para confirmaciones y alertas

### 🔍 Vista de Detalle
- Visualización completa de toda la información de la tarea
- **Badges** de prioridad, estado y fecha con colores distintivos
- **Sección de detalles** con grid responsive:
  - Responsable
  - Progreso con barra visual
  - Fechas de creación y última actualización
  
- **Acciones rápidas**:
  - Cambiar estado (a cualquier estado disponible)
  - Marcar como completada
  - Eliminar tarea (con confirmación)
  - Editar tarea
  
- **Panel de comentarios**: Sistema de mensajes en tiempo real

### 💬 Sistema de Mensajes/Comentarios
- Chat en tiempo real asociado a cada tarea
- **Polling automático**: Actualización cada 3 segundos
- Interfaz de burbujas tipo chat
- Indicación de usuario y timestamp
- Campo de entrada con validación

## 🎨 Diseño UI/UX

### Sistema de Diseño Coherente
```css
--primary-color: #4a9c9f
--secondary-color: #2c5f63
--todo-color: #f39c12
--progress-color: #3498db
--done-color: #27ae60
--urgent-color: #e74c3c
--high-color: #e67e22
--medium-color: #f39c12
--low-color: #95a5a6
```

### Características Visuales
- **Hero sections** con gradientes en todas las vistas
- **Animaciones suaves**: fadeIn, slideIn, bounceIn
- **Sombras y elevación**: Sistema de 3 niveles
- **Bordes redondeados**: 12-20px según contexto
- **Iconografía consistente**: Font Awesome 6
- **Responsive design**: 4 breakpoints (1200px, 768px, 480px)

### Componentes Principales

#### 1. TaskListComponent (Tablero Kanban)
- Grid de 3 columnas con CDK Drag & Drop
- KPI cards en la parte superior
- Tarjetas de tarea con información completa
- Estados vacíos con mensajes amigables
- Handle de arrastre visible al hover

#### 2. TaskFormComponent (Formulario)
- Secciones organizadas con headers visuales
- Inputs con iconos descriptivos
- Select personalizados sin Material
- Range slider para progreso con preview
- Validación en tiempo real
- Botones de acción destacados

#### 3. TaskDetailComponent (Vista detalle)
- Layout en 2 secciones: Info + Mensajes
- Grid de detalles responsive
- Badges de estado con colores semánticos
- Botones de acción rápida
- Integración con panel de mensajes

#### 4. MessagePanelComponent (Chat)
- Lista de mensajes con scroll
- Burbujas estilizadas
- Formulario de envío inline
- Polling automático para actualizaciones

## 🔧 Estructura Técnica

### Modelos TypeScript
```typescript
TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface TaskDto {
  id?: number;
  title: string;
  description?: string;
  responsibleId?: string;
  responsibleName?: string;
  project?: string;
  priority?: TaskPriority;
  progress?: number; // 0-100
  dueDate?: string;
  status: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
}
```

### Servicios
- **TaskService**: CRUD completo de tareas
- **MessageService**: Gestión de comentarios

### Endpoints API
```
GET    /api/tasks          - Listar todas las tareas
GET    /api/tasks/:id      - Obtener detalle de tarea
POST   /api/tasks          - Crear nueva tarea
PUT    /api/tasks/:id      - Actualizar tarea
DELETE /api/tasks/:id      - Eliminar tarea
GET    /api/tasks/:id/messages - Mensajes de tarea
POST   /api/tasks/:id/messages - Crear mensaje
```

### Rutas
```typescript
/tasks              - Tablero Kanban (lista)
/tasks/new          - Crear nueva tarea
/tasks/edit/:id     - Editar tarea existente
/tasks/:id          - Ver detalle de tarea
```

## 🚀 Características Avanzadas

### Drag & Drop Inteligente
- Cambio automático de estado al mover entre columnas
- Animaciones suaves de transición
- Placeholder visual durante el arrastre
- Reordenamiento dentro de la misma columna

### Gestión de Estados
- 4 estados disponibles: TODO, IN_PROGRESS, DONE, CANCELLED
- Cambio rápido desde vista de detalle
- Confirmación con SweetAlert2
- Actualización inmediata en backend

### Sistema de Prioridades
- 4 niveles: LOW, MEDIUM, HIGH, URGENT
- Código de colores consistente
- Badges visuales en todas las vistas
- Filtrado visual por color de borde

### Progreso Visual
- Slider de 0-100% en formulario
- Barra de progreso en tarjetas y detalle
- Actualización en tiempo real
- Valor numérico junto a barra visual

### Fechas Inteligentes
- Indicador de vencimiento
- Resaltado en rojo si está vencida
- Formato localizado (dd/MM/yyyy)
- Timestamps completos en detalle

## 📱 Responsive Design

### Desktop (>1200px)
- Kanban en 3 columnas lado a lado
- KPIs en 4 columnas
- Formularios en 2 columnas

### Tablet (768px - 1200px)
- Kanban en 1 columna vertical
- KPIs en 2 columnas
- Formularios en 1 columna

### Mobile (<768px)
- Todo en columna única
- Hero sections compactos
- Botones full-width
- Mensajes optimizados para táctil

## 🔐 Seguridad y Validación

- AuthGuard en todas las rutas del módulo
- Validación de formularios con Reactive Forms
- Confirmaciones para acciones destructivas
- Manejo de errores con notificaciones visuales
- Sanitización de inputs

## 🎯 Casos de Uso

### Usuario Administrador
1. Crear tareas y asignar responsables
2. Gestionar proyectos e iniciativas
3. Monitorear progreso global
4. Eliminar tareas obsoletas

### Usuario Responsable
1. Ver tareas asignadas
2. Actualizar progreso
3. Cambiar estados
4. Comentar y colaborar

### Equipo
1. Vista compartida del tablero
2. Comunicación por comentarios
3. Seguimiento de deadlines
4. Colaboración en tiempo real

## 🔄 Integración con Backend

### API Tasks (Java Spring Boot)
- Puerto: 8087
- Base path: `/api/tasks`
- Base de datos: PostgreSQL
- Eventos: Sistema de notificaciones con RabbitMQ

### Sincronización
- Cambios de estado inmediatos
- Polling cada 3s para mensajes
- Optimistic updates en drag & drop
- Error handling con rollback

## 📈 Mejoras Futuras Sugeridas

1. **Filtros avanzados**: Por prioridad, responsable, proyecto, fechas
2. **Vista calendario**: Visualización de deadlines en calendario
3. **Notificaciones push**: Avisos de nuevos comentarios o cambios
4. **Búsqueda**: Buscar tareas por texto
5. **Exportación**: PDF/Excel de reportes
6. **Etiquetas/Tags**: Sistema de categorización adicional
7. **Subtareas**: Desglose de tareas complejas
8. **Timer/Tracker**: Seguimiento de tiempo invertido
9. **Archivado**: Mover tareas completadas a archivo
10. **Dashboard**: Gráficos y métricas avanzadas

## 🛠️ Tecnologías Utilizadas

- **Angular 18+** (Standalone components)
- **TypeScript**
- **RxJS** (Observables, polling)
- **Angular CDK** (Drag & Drop)
- **SweetAlert2** (Notificaciones)
- **Font Awesome 6** (Iconos)
- **CSS Grid & Flexbox** (Layouts responsive)
- **CSS Variables** (Sistema de diseño)

## ✅ Estado Actual

✅ Modelo de datos sincronizado con backend  
✅ Tablero Kanban completamente funcional  
✅ Drag & Drop con actualización automática  
✅ Formularios con todos los campos del backend  
✅ Vista de detalle completa  
✅ Sistema de mensajes en tiempo real  
✅ Diseño moderno y responsive  
✅ Validaciones y manejo de errores  
✅ Sin dependencias de Angular Material  
✅ Integración completa con tasks_api  

---

**Desarrollado para I-Wellness Tourism Platform**  
*Sistema de gestión de tareas tipo Kanban con diseño moderno y funcionalidad completa*
