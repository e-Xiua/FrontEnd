# Configuración de Backend - Módulo de Tareas

## 📡 Endpoints Configurados

### Tasks API (Puerto 8091)

El módulo de tareas se conecta al microservicio `tasks_api` desplegado en Docker.

**Base URL:** `http://localhost:8091/api/tasks`

### Archivos de Configuración

#### 1. TaskService (`services/task.service.ts`)
```typescript
private readonly baseUrl = 'http://localhost:8091/api/tasks';
```

**Endpoints disponibles:**
- `GET /all` - Obtener todas las tareas (sin paginación)
- `GET /{id}/detail` - Obtener detalle completo de una tarea
- `GET /kpis` - Obtener estadísticas (KPIs)
- `POST /` - Crear nueva tarea
- `PUT /{id}` - Actualizar tarea existente
- `DELETE /{id}` - Eliminar tarea

#### 2. MessageService (`services/message.service.ts`)
```typescript
private readonly baseUrl = 'http://localhost:8091/api/tasks';
```

**Endpoints disponibles:**
- `GET /{taskId}/messages` - Obtener mensajes de una tarea
- `POST /{taskId}/messages` - Enviar mensaje a una tarea

---

## 🐳 Docker - Tasks API

### Verificar que el contenedor esté corriendo:
```bash
docker ps --filter "name=tasks-api"
```

### Ver logs del contenedor:
```bash
docker logs tasks-api -f
```

### Verificar health del servicio:
```bash
curl http://localhost:8091/api/tasks
```

### Iniciar el contenedor (si está detenido):
```bash
cd /home/estudiante/Tesis/tasks_api
docker-compose up -d
```

---

## 🔧 Configuración para Producción

### Opción 1: Variables de Entorno
Crear un archivo `environment.ts`:

```typescript
export const environment = {
  production: false,
  tasksApiUrl: 'http://localhost:8091/api/tasks'
};
```

### Opción 2: Proxy de Angular
Crear/modificar `proxy.conf.json`:

```json
{
  "/api/tasks": {
    "target": "http://localhost:8091",
    "secure": false,
    "changeOrigin": true
  }
}
```

Luego en `angular.json`:
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

Y cambiar las URLs en los servicios a:
```typescript
private readonly baseUrl = '/api/tasks';
```

---

## 🧪 Testing

### Probar creación de tarea:
```bash
curl -X POST http://localhost:8091/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tarea de prueba",
    "description": "Descripción de prueba",
    "status": "TODO",
    "priority": "MEDIUM",
    "responsibleName": "Usuario Test",
    "dueDate": "2025-12-31",
    "progress": 0
  }'
```

### Probar listado de tareas:
```bash
curl http://localhost:8091/api/tasks/all
```

### Probar KPIs:
```bash
curl http://localhost:8091/api/tasks/kpis
```

---

## 🔍 Troubleshooting

### Error 404 "Cannot POST /api/tasks"
- ✅ **Solución aplicada:** Cambiadas las URLs de `/api/tasks` a `http://localhost:8091/api/tasks`
- **Causa:** El frontend intentaba hacer peticiones a su propio puerto (4200) en lugar del backend (8091)

### CORS Errors
- El backend tiene `@CrossOrigin(origins = "*")` habilitado temporalmente
- Para producción, configurar dominios específicos

### Timeout o Connection Refused
- Verificar que el contenedor `tasks-api` esté corriendo
- Verificar que no haya firewall bloqueando el puerto 8091
- Verificar que la red Docker `tesisNetwork` esté creada

---

## 📊 Modelo de Datos

### TaskDto
```typescript
{
  id?: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  responsibleName?: string;
  dueDate?: string;
  progress?: number; // 0-100
  project?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### TaskDetailDto
Extiende TaskDto con información adicional de historial y mensajes.

### MessageDto
```typescript
{
  id?: number;
  taskId: number;
  senderId: string;
  content: string;
  timestamp?: string;
}
```

---

## 🚀 Próximos Pasos

1. **Implementar sistema de autenticación:** Agregar headers `X-Actor-Id` a las peticiones
2. **Configurar environments:** Separar URLs por entorno (dev/staging/prod)
3. **Implementar WebSockets:** Para actualizaciones en tiempo real del tablero Kanban
4. **Agregar caché:** Para mejorar performance del listado de tareas
5. **Implementar retry logic:** Para manejar fallos temporales de red

---

## 📝 Notas

- El backend usa H2 Database en modo embedded
- Los datos persisten en el volumen Docker `tasks_data`
- El healthcheck del contenedor verifica el endpoint `/api/tasks` cada 30 segundos
- RabbitMQ está configurado para notificaciones (eventos de tareas)
