# Observatorio de Turismo de Bienestar - Integración Frontend

## 📋 Resumen

Se ha integrado exitosamente el módulo de web scraping con el frontend de e-Xiua, creando un **Observatorio de Turismo de Bienestar** completo con dashboards estéticos y públicos (sin necesidad de autenticación).

## 🎯 Componentes Creados

### 1. **Servicio Principal** 
- `ObservatorioService` (`shared/services/observatorio.service.ts`)
- Conecta con todas las APIs del módulo de web scraping
- Maneja errores y proporciona datos por defecto
- Incluye tipado completo con TypeScript

### 2. **Modelos TypeScript**
- `observatorio.models.ts` (`shared/models/`)
- Interfaces para todas las respuestas de APIs:
  - Clima (OpenWeather)
  - IMN Costa Rica
  - Índice UV
  - Volcán Arenal (OVSICORI)
  - Eventos y Noticias (ICT)

### 3. **Dashboards Públicos**

#### Dashboard Principal (`/observatorio`)
- Vista general con cards de resumen
- Clima actual
- Índice UV
- Estado del Volcán Arenal
- Noticias y eventos recientes
- Diseño responsive con gradientes y sombras
- Auto-refresh cada 10 minutos

#### Dashboard de Clima (`/observatorio/clima`)
- Condiciones actuales detalladas
- Pronóstico extendido de 7 días
- Métricas turísticas
- Evaluación de idoneidad para actividades
- Insights del IMN Costa Rica
- Recomendaciones personalizadas

#### Dashboard de Índice UV (`/observatorio/uv`)
- Análisis UV actual con código de colores
- Pronóstico horario
- Recomendaciones de protección solar
- Consejos por horario (mañana, mediodía, tarde)
- Mejores horas para actividades al aire libre

#### Dashboard de Volcán Arenal (`/observatorio/volcan`)
- Estado actual del volcán
- Nivel de alerta (código de colores)
- Actividad sísmica reciente (últimos 15 eventos)
- Evaluación de seguridad turística
- Recomendaciones para visitantes
- Información de OVSICORI-UNA

#### Dashboard de Eventos y Noticias (`/observatorio/eventos`)
- Tendencias y temas destacados
- Próximos eventos
- Noticias de turismo de bienestar
- Noticias específicas de La Fortuna
- Últimas publicaciones del ICT
- Sistema de etiquetas y categorías

## 🚀 Características Principales

### Diseño Estético
- **Gradientes personalizados** para cada dashboard
- **Material Icons** para iconografía consistente
- **Animaciones suaves** en hover y transiciones
- **Códigos de color** intuitivos (verde=seguro, rojo=peligro)
- **Cards con sombras** y elevación en hover
- **Diseño responsive** para móviles, tablets y desktop

### Experiencia de Usuario
- ✅ **Sin autenticación requerida** - Acceso público total
- ✅ **Auto-refresh** automático de datos
- ✅ **Loading states** con spinners animados
- ✅ **Error handling** con mensajes amigables
- ✅ **Navegación intuitiva** entre dashboards
- ✅ **Botón de actualización manual**
- ✅ **Última actualización visible**

### Integración de Datos
- 🌤️ **Clima**: OpenWeather API + IMN Costa Rica
- ☀️ **UV**: Análisis basado en datos del IMN
- 🌋 **Volcán**: OVSICORI - Universidad Nacional
- 📰 **Eventos**: Instituto Costarricense de Turismo (ICT)

## 📁 Estructura de Archivos

```
src/app/
├── features/
│   └── observatorio/
│       ├── observatorio-dashboard/
│       │   ├── observatorio-dashboard.component.ts
│       │   ├── observatorio-dashboard.component.html
│       │   └── observatorio-dashboard.component.css
│       ├── clima-dashboard/
│       │   ├── clima-dashboard.component.ts
│       │   ├── clima-dashboard.component.html
│       │   └── clima-dashboard.component.css
│       ├── uv-dashboard/
│       │   └── uv-dashboard.component.ts (inline template/styles)
│       ├── volcan-dashboard/
│       │   └── volcan-dashboard.component.ts (inline template/styles)
│       └── eventos-dashboard/
│           └── eventos-dashboard.component.ts (inline template/styles)
├── shared/
│   ├── services/
│   │   └── observatorio.service.ts
│   └── models/
│       └── observatorio.models.ts
└── app.routes.ts (rutas públicas agregadas)
```

## 🌐 Rutas Disponibles

Todas las rutas son **públicas** (sin guards de autenticación):

- `/observatorio` - Dashboard principal
- `/observatorio/clima` - Dashboard de clima
- `/observatorio/uv` - Dashboard de índice UV
- `/observatorio/volcan` - Dashboard de volcán Arenal
- `/observatorio/eventos` - Dashboard de eventos y noticias

## 🔧 Configuración

### 1. Iniciar el Servidor de Web Scraping

```bash
cd /home/estudiante/Tesis/web_scrapping
python3 server.py
```

El servidor estará disponible en `http://localhost:8090`

### 2. Iniciar el Frontend Angular

```bash
cd /home/estudiante/Tesis/FrontEnd/front-I-Wellness
npm start
```

El frontend estará disponible en `http://localhost:4200`

### 3. Acceder al Observatorio

Navega a: `http://localhost:4200/observatorio`

## 📊 APIs Consumidas

### Clima
- `GET /api/weather/current?lat={lat}&lon={lon}` - Clima actual
- `GET /api/weather/forecast?days={days}` - Pronóstico extendido
- `GET /api/weather/tourism-metrics` - Métricas turísticas

### IMN Costa Rica
- `GET /api/imn/current` - Datos actuales
- `GET /api/imn/hourly?hours={hours}` - Datos horarios
- `GET /api/imn/daily` - Resumen diario
- `GET /api/imn/insights` - Insights turísticos

### Índice UV
- `GET /api/uv/current` - UV actual
- `GET /api/uv/forecast` - Pronóstico UV
- `GET /api/uv/insights` - Recomendaciones

### Volcán Arenal
- `GET /api/volcano/status` - Estado del volcán
- `GET /api/volcano/seismic?limit={limit}` - Actividad sísmica
- `GET /api/volcano/insights` - Insights turísticos

### Eventos ICT
- `GET /api/events/recent?limit={limit}` - Noticias recientes
- `GET /api/events/wellness?limit={limit}` - Noticias wellness
- `GET /api/events/la-fortuna?limit={limit}` - Noticias La Fortuna
- `GET /api/events/insights` - Tendencias y eventos

## 🎨 Paleta de Colores

### Dashboard Principal
- Primary: `#00897b` (Teal)
- Secondary: `#26a69a`
- Gradient: `#e0f2f1` → `#b2dfdb`

### Clima
- Primary: `#00acc1` (Cyan)
- Gradient: `#e0f7fa` → `#b2ebf2`

### UV
- Primary: `#ff9800` (Orange)
- Gradient: `#fff3e0` → `#ffe0b2`

### Volcán
- Primary: `#c2185b` (Pink)
- Gradient: `#fce4ec` → `#f8bbd0`

### Eventos
- Primary: `#5e35b1` (Deep Purple)
- Gradient: `#e8eaf6` → `#c5cae9`

## 🔄 Auto-Refresh

- **Dashboard Principal**: 10 minutos
- **Clima**: 15 minutos
- **UV**: 15 minutos
- **Volcán**: 15 minutos
- **Eventos**: 30 minutos

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

### Adaptaciones Móviles
- Header apilado verticalmente
- Cards en una sola columna
- Tipografía ajustada
- Spacing optimizado
- Botones de ancho completo

## 🚧 Próximos Pasos Sugeridos

1. **Integrar con el header principal** - Agregar enlace al observatorio en el menú
2. **Caché de datos** - Implementar localStorage para reducir llamadas a APIs
3. **Gráficos interactivos** - Agregar Chart.js o D3.js para visualizaciones
4. **Notificaciones** - Alertas push para cambios importantes (alertas volcánicas, clima extremo)
5. **Comparación histórica** - Mostrar tendencias y comparativas
6. **Exportar reportes** - Descargar datos en PDF o Excel
7. **Mapas interactivos** - Integrar Leaflet para visualizar ubicaciones
8. **Idiomas** - Soporte multi-idioma (ES/EN)

## 🐛 Troubleshooting

### Error: "Cannot connect to API"
- Verificar que el servidor Python esté corriendo en puerto 8090
- Verificar configuración de CORS

### Error: "Module not found"
- Ejecutar `npm install` en el directorio del frontend
- Verificar que todas las rutas de importación sean correctas

### Datos no se actualizan
- Verificar consola del navegador para errores
- Verificar que las APIs del servidor Python respondan correctamente
- Probar manualmente: `curl http://localhost:8090/api/weather/current`

## 📄 Licencia

Este proyecto es parte del sistema e-Xiua - Observatorio de Turismo de Bienestar para La Fortuna, Costa Rica.

---

**Autor**: Sistema e-Xiua  
**Fecha**: Noviembre 2025  
**Versión**: 1.0.0
