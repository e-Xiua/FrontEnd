# Configuración del Módulo Tasks en el Frontend

## 📋 Descripción
Módulo Angular para la gestión de tareas que se conecta al microservicio Tasks API.

## 🔌 Configuración de Conexión

### Proxy Configuration
El frontend usa un archivo `proxy.conf.json` para redirigir las peticiones API al backend:

```json
{
  "/api/tasks": {
    "target": "http://localhost:8091",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### Servicios
Los servicios del módulo tasks están configurados para usar rutas relativas:

**TaskService** (`task.service.ts`):
- Base URL: `/api/tasks`
- Endpoints:
  - `GET /api/tasks/all` - Lista de tareas
  - `GET /api/tasks/{id}` - Detalle de tarea
  - `POST /api/tasks` - Crear tarea
  - `PUT /api/tasks/{id}` - Actualizar tarea
  - `DELETE /api/tasks/{id}` - Eliminar tarea

**MessageService** (`message.service.ts`):
- Base URL: `/api/tasks`
- Endpoints:
  - `GET /api/tasks/{taskId}/messages` - Mensajes de una tarea
  - `POST /api/tasks/{taskId}/messages` - Enviar mensaje

## 🚀 Iniciar el Frontend con Proxy

### Opción 1: Usar npm start (recomendado)
```bash
cd /home/estudiante/Tesis/FrontEnd/front-I-Wellness
npm start
```

El comando `npm start` ahora incluye automáticamente `--proxy-config proxy.conf.json`

### Opción 2: Iniciar sin proxy
```bash
npm run start:no-proxy
```

### Opción 3: Comando directo
```bash
ng serve --proxy-config proxy.conf.json
```

## ✅ Verificación

### 1. Verificar que el backend está corriendo
```bash
cd /home/estudiante/Tesis/tasks_api
./health-check.sh
```

O manualmente:
```bash
curl http://localhost:8091/api/tasks
```

### 2. Verificar el proxy del frontend
Una vez que el frontend esté corriendo (normalmente en `http://localhost:4200`), abre las DevTools del navegador y verifica:

- En la pestaña **Network**, las peticiones a `/api/tasks` deben ir a `http://localhost:8091`
- No debe haber errores CORS
- Las respuestas deben ser exitosas (200 OK)

### 3. Prueba manual en el navegador
Con el frontend corriendo, intenta:

1. Navegar al módulo de tareas
2. Listar tareas existentes
3. Crear una nueva tarea
4. Ver detalles de una tarea
5. Enviar un mensaje en una tarea

## 🔧 Troubleshooting

### Error: CORS
**Síntoma**: Error de CORS en la consola del navegador

**Solución**:
1. Verifica que el proxy esté configurado correctamente
2. Asegúrate de iniciar el frontend con: `npm start`
3. Verifica que el backend tenga CORS configurado (ya está en `WebConfig.java`)

### Error: Connection Refused
**Síntoma**: `ERR_CONNECTION_REFUSED` o `ECONNREFUSED`

**Solución**:
1. Verifica que el backend está corriendo: `docker ps | grep tasks-api`
2. Verifica el puerto: `curl http://localhost:8091/api/tasks`
3. Verifica los logs: `docker logs tasks-api`

### Error: 404 Not Found
**Síntoma**: Las rutas API retornan 404

**Solución**:
1. Verifica que la URL base en los servicios sea `/api/tasks`
2. Verifica que el proxy esté configurado
3. Revisa los logs del backend: `docker logs -f tasks-api`

### Error: Proxy No Funciona
**Síntoma**: Las peticiones no se redirigen al backend

**Solución**:
1. Detén el servidor: `Ctrl+C`
2. Limpia el cache: `rm -rf .angular/cache`
3. Inicia nuevamente: `npm start`
4. Verifica el archivo `proxy.conf.json` existe en la raíz del proyecto

## 📊 Estructura de Datos

### Task Model
```typescript
export interface TaskDto {
  id?: number;
  title: string;
  description: string;
  assignedToUserId: number;
  createdByUserId: number;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
}
```

### Message Model
```typescript
export interface MessageDto {
  id?: number;
  taskId: number;
  senderId: number;
  content: string;
  timestamp?: Date;
}
```

## 🔄 Flujo de Comunicación

```
┌─────────────┐         ┌──────────┐         ┌─────────────┐
│   Angular   │ ───────>│  Proxy   │ ───────>│  Tasks API  │
│  (4200)     │ /api/*  │  Config  │  :8091  │  (Docker)   │
└─────────────┘         └──────────┘         └─────────────┘
      │                                              │
      │                                              │
      └──────────────────────────────────────────────┘
           HTTP Requests con CORS permitido
```

## 📝 Notas Adicionales

- El proxy solo funciona en modo desarrollo (`ng serve`)
- En producción, deberás configurar un API Gateway o Nginx
- Los interceptors de autenticación funcionan normalmente con el proxy
- El proxy no afecta las llamadas a otros microservicios
