# FrontEnd_IWellness

Interfaz web del ecosistema de turismo de bienestar, diseñada para turistas, proveedores y administradores.

## 📌 Descripción

`FrontEnd_IWellness` es la aplicación web principal que permite la interacción entre los distintos actores del ecosistema de turismo de bienestar. Este frontend facilita la visualización, registro, consulta y gestión de la información relacionada con usuarios, servicios turísticos, reservas y preferencias.

El sistema se adapta a distintos roles: turistas, proveedores y administradores, presentando interfaces específicas y funcionalidades diferenciadas para cada uno.

## 🚀 Tecnologías

- Angular 19  
- TypeScript  
- HTML5 / CSS3  
- TailwindCSS  
- RxJS  
- JWT / Firebase Authentication  
- Angular Material / PrimeNG

## ✨ Funcionalidades principales

- Registro y autenticación de usuarios (turista, proveedor, administrador)
- Exploración de servicios turísticos por preferencias e intereses
- Gestión de servicios y reservas para proveedores
- Administración de usuarios, estadísticas y control del sistema
- Dashboards visuales con gráficas y métricas relevantes

## 🌐 Comunicación con los microservicios

Este frontend consume los siguientes microservicios vía HTTP:

- `admin_users_api` → Gestión de usuarios y autenticación
- `providers_api` → Gestión de servicios turísticos y reservas
- `user_preferences_api` → Registro y gestión de preferencias del usuario
- `IWellness_Data_Services` → Especificamente data_analisys.py → Consulta de datos analíticos y reportes

## 🛡️ Seguridad

- Autenticación mediante Firebase Auth o JWT
- Protección de rutas según roles: `ROLE_ADMIN`, `ROLE_TURISTA`, `ROLE_PROVEEDOR`
- Guardias de ruta y servicios de interceptores

## ⚙️ Para su funcionamiento

El frontend debe ejecutarse junto con:

- `admin_users_api`
- `providers_api`
- `user_preferences_api`
- `Queue_Rabbit` y `IWellness_Data_Services` para el flujo de datos analíticos
