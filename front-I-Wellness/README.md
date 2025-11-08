````markdown
# e-Xiua Frontend

Sistema de Gobernanza Inteligente para el Ecosistema de Turismo de Bienestar en La Fortuna, Costa Rica.

Este proyecto fue generado usando [Angular CLI](https://github.com/angular/angular-cli) versión 19.1.8.

## 🌟 Sobre e-Xiua

e-Xiua es una plataforma integral que conecta a todos los actores del ecosistema de turismo de bienestar mediante tecnologías avanzadas de IA, análisis de datos en tiempo real y una arquitectura de microservicios escalable.

### 🎯 Visión del Sistema

La plataforma e-Xiua transforma la experiencia del turismo de bienestar en La Fortuna mediante:

- **Inteligencia Artificial**: Optimización de rutas con algoritmos de aprendizaje por refuerzo multi-objetivo (MRL-AMIS)
- **Datos en Tiempo Real**: Observatorio integrado con información climática, índice UV, actividad volcánica y eventos culturales
- **Personalización**: Sistema de recomendaciones basado en preferencias individuales de visitantes
- **Conectividad**: Comunicación en tiempo real entre visitantes y proveedores
- **Analítica**: Business Intelligence para toma de decisiones informadas

## 🚀 Características Principales del Landing Page

El nuevo landing page (`localhost:4200`) presenta una experiencia moderna y completa que incluye:

### 1. **Hero Section Impactante**
- Presentación clara del sistema y su propósito
- Call-to-actions destacados (Login, Registro, Explorar)
- Diseño responsive con animaciones sutiles

### 2. **Showcase de Funcionalidades**
Seis áreas principales con información detallada:
- 🌦️ **Observatorio en Tiempo Real**: Clima, UV, Volcán, Eventos
- �️ **Optimización Inteligente de Rutas**: IA con Q-Learning y MRL-AMIS
- 🏨 **Gestión de Servicios Turísticos**: Panel completo para proveedores
- ⚙️ **Sistema de Preferencias**: Recomendaciones personalizadas
- � **Comunicación en Tiempo Real**: Chat y notificaciones
- 📊 **Analítica Avanzada**: Dashboards y reportes

### 3. **Stack Tecnológico**
Visualización clara de las tecnologías utilizadas:
- Microservicios (Spring Boot, FastAPI, gRPC, RabbitMQ)
- Frontend (Angular 19, TypeScript, Material Design)
- IA & ML (Q-Learning, MRL-AMIS, NumPy/Pandas)
- Integración de Datos (APIs REST, WebSockets, Web Scraping)

### 4. **Información del Turismo de Bienestar**
- Definición según UNWTO
- Pilares del bienestar (Relajación, Naturaleza, Salud, Espiritualidad)
- Contexto de La Fortuna como destino

### 5. **Perfiles de Usuario**
Información clara para cada tipo de usuario:
- **Visitantes**: Exploración y reserva de experiencias
- **Proveedores**: Gestión de servicios y análisis
- **Administradores**: Gobernanza del ecosistema

### 6. **Galería Visual**
Imágenes representativas del turismo de bienestar en Costa Rica

## 📁 Estructura de Rutas

### Rutas Públicas
- `/` - Landing page principal (rediseñado)
- `/metricas` - Dashboard de métricas del sistema
- `/observatorio` - Dashboard del observatorio
  - `/observatorio/clima` - Información climática
  - `/observatorio/uv` - Índice UV
  - `/observatorio/volcan` - Volcán Arenal
  - `/observatorio/eventos` - Eventos y noticias
- `/objetivos` - Información sobre objetivos del sistema
- `/temas` - Temas de investigación
- `/buscador-web` - Búsqueda de información web
- `/login` - Inicio de sesión
- `/registro` - Selección de tipo de registro
- `/registroturista` - Registro de visitantes
- `/registroproveedor` - Registro de proveedores

### Rutas Protegidas por Rol

**Turistas** (`/turista/*`)
- Dashboard personalizado
- Exploración de servicios
- Sistema de reservas
- Gestión de preferencias
- Visualización de rutas optimizadas

**Proveedores** (`/proveedor/*`)
- Gestión de servicios
- Dashboard de métricas
- Sistema de chat
- Análisis de desempeño
- Calendario de disponibilidad

**Administradores** (`/admin/*`)
- Panel administrativo completo
- Gestión de usuarios
- Creación y optimización de rutas
- Analítica del ecosistema
- Configuración del sistema

## 🛠️ Desarrollo

### Servidor de Desarrollo

```bash
ng serve
```

Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente al modificar archivos.

### Scaffolding de Código

Para generar un nuevo componente:

```bash
ng generate component component-name
```

Para ver todas las opciones disponibles:

```bash
ng generate --help
```

### Compilación

```bash
ng build
```

Los artefactos de compilación se almacenarán en el directorio `dist/`.

### Pruebas

**Pruebas Unitarias:**
```bash
ng test
```

**Pruebas E2E con Cypress:**
```bash
ng e2e
```

## 🏗️ Arquitectura del Sistema

### Frontend (Este Proyecto)
- **Framework**: Angular 19 con Standalone Components
- **Estilo**: CSS3 moderno con variables y gradientes
- **Estado**: Services y RxJS para gestión reactiva
- **Routing**: Lazy loading y guards por roles
- **UI Components**: Material Design y componentes custom

### Backend (Microservicios)
El frontend se conecta con múltiples microservicios:

1. **admin_users_api** (Spring Boot)
   - Autenticación y autorización
   - Gestión de usuarios y permisos

2. **providers_api** (Spring Boot)
   - CRUD de servicios turísticos
   - Gestión de reservas

3. **user_preferences_api** (Spring Boot)
   - Preferencias de visitantes
   - Sistema de recomendaciones

4. **route-optimizer-service** (Spring Boot + gRPC)
   - Conexión con modelo de IA
   - Optimización de rutas

5. **ModeloMrlAmisPythonService** (Python + gRPC)
   - Algoritmos de RL (Q-Learning)
   - Análisis multi-objetivo (MRL-AMIS)

6. **web_scrapping** (Python FastAPI)
   - Datos climáticos (OpenWeather, IMN)
   - Índice UV
   - Alertas volcánicas (OVSICORI)
   - Eventos (ICT)

7. **messaging-api** (Spring Boot + WebSockets)
   - Chat en tiempo real
   - Notificaciones push

8. **Queue-Rabbit** (RabbitMQ)
   - Message broker para comunicación asíncrona

9. **Data_Services** (Python)
   - Análisis de datos
   - Generación de reportes

## 🔐 Seguridad

- **Autenticación**: JWT tokens
- **Autorización**: Guards por rol (Admin, Proveedor, Turista)
- **Interceptores**: Inyección automática de tokens
- **CORS**: Configurado en API Gateway
- **Validación**: Frontend y Backend

## 📦 Dependencias Principales

```json
{
  "dependencies": {
    "@angular/core": "^19.1.0",
    "@angular/material": "^19.2.11",
    "@swimlane/ngx-charts": "^22.0.0",
    "chart.js": "^4.4.9",
    "leaflet": "^1.9.4",
    "jwt-decode": "^4.0.0",
    "@stomp/stompjs": "^7.2.1",
    "sweetalert2": "^11.19.1"
  }
}
```

## 🎨 Guía de Estilos

El sistema utiliza una paleta de colores consistente:

- **Primary**: `#2973B2` (Azul corporativo)
- **Secondary**: `#9ACBD0` (Azul claro)
- **Accent**: `#34d399` (Verde éxito)
- **Tipografía**: Poppins, Inter, system fonts

## 🚀 Despliegue

### Variables de Entorno
Configurar en `environment.ts`:
- API_BASE_URL
- WS_URL
- GOOGLE_MAPS_KEY

### Build de Producción
```bash
ng build --configuration production
```

### Docker
```bash
docker build -t e-xiua-frontend .
docker run -p 4200:80 e-xiua-frontend
```

## 📝 Cambios Recientes (Noviembre 2025)

### v2.0 - Rediseño Completo del Landing Page

✅ **Landing Page Profesional y Completo**
- Hero section moderna con gradientes y animaciones
- 6 secciones de funcionalidades principales detalladas
- Showcase del stack tecnológico
- Perfiles de usuario claramente diferenciados
- Galería visual mejorada
- CTAs estratégicos para conversión

✅ **Separación de Concerns**
- Landing page enfocado en presentación
- Métricas movidas a `/metricas`
- Mejor organización del contenido

✅ **Rebranding Completo**
- Cambio de I-Wellness a e-Xiua
- Actualización de todos los componentes
- Documentación actualizada
- Metadatos y configuración

✅ **Mejoras de UX**
- Diseño responsive en todas las secciones
- Scroll suave entre secciones
- Animaciones y transiciones fluidas
- Información clara y accesible

## 📚 Recursos Adicionales

- [Documentación de Angular](https://angular.dev)
- [Material Design](https://material.angular.io)
- [Leaflet Maps](https://leafletjs.com)
- [NGX Charts](https://swimlane.gitbook.io/ngx-charts)

## 🤝 Contribución

Este proyecto es parte de una tesis de investigación sobre sistemas de gobernanza inteligente para turismo de bienestar.

## 📄 Licencia

Sistema e-Xiua - Observatorio de Turismo de Bienestar  
La Fortuna, Costa Rica  
© 2025

---

**Desarrollado con ❤️ para el ecosistema de turismo de bienestar de La Fortuna**
````
