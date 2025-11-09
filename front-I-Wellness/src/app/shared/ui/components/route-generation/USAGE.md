# RouteGenerationComponent - Guía de Uso

## Descripción
Componente standalone que muestra todas las rutas completadas obtenidas del endpoint `/api/v1/routes/completed`. Utiliza `RouteGenerationStateService` para manejar el estado y `ShowRoutesManyOptionsComponent` para la visualización.

## Características
✅ **Componente Standalone** - No requiere módulo, se puede importar directamente
✅ **Sin nuevos adapters** - Usa las interfaces existentes de `route-builder-state.service`
✅ **Manejo de estado reactivo** - Observables con RxJS
✅ **Filtrado por usuario** - Opcional para mostrar rutas de un usuario específico
✅ **Estados manejados** - Loading, Error, Empty, Success

## Uso Básico

### 1. Para Admin (todas las rutas)

```typescript
import { Component } from '@angular/core';
import { RouteGenerationComponent } from '@shared/ui/components/route-generation';

@Component({
  selector: 'app-admin-routes',
  standalone: true,
  imports: [RouteGenerationComponent],
  template: `
    <app-route-generation
      title="Todas las Rutas del Sistema"
      description="Rutas optimizadas de todos los usuarios"
      (routeSelected)="onRouteSelected($event)"
      (providerSelected)="onProviderSelected($event)">
    </app-route-generation>
  `
})
export class AdminRoutesComponent {
  onRouteSelected(event: any) {
    console.log('Ruta seleccionada:', event);
  }

  onProviderSelected(event: any) {
    console.log('Proveedor seleccionado:', event);
  }
}
```

### 2. Para Turista (rutas del usuario actual)

```typescript
import { Component, OnInit } from '@angular/core';
import { RouteGenerationComponent } from '@shared/ui/components/route-generation';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-tourist-routes',
  standalone: true,
  imports: [RouteGenerationComponent],
  template: `
    <app-route-generation
      title="Mis Rutas Guardadas"
      description="Explora tus rutas optimizadas"
      [userId]="currentUserId"
      [maxRoutesToShow]="5"
      (routeSelected)="onRouteSelected($event)"
      (providerSelected)="onProviderSelected($event)">
    </app-route-generation>
  `
})
export class TouristRoutesComponent implements OnInit {
  currentUserId?: string;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId();
  }

  onRouteSelected(event: any) {
    console.log('Ruta seleccionada:', event);
  }

  onProviderSelected(event: any) {
    console.log('Proveedor seleccionado:', event);
  }
}
```

## Inputs

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `title` | `string` | `'Rutas generadas'` | Título del componente |
| `description` | `string` | `'Explora las rutas optimizadas disponibles.'` | Descripción bajo el título |
| `showHeader` | `boolean` | `true` | Mostrar u ocultar el header |
| `userId` | `string \| number` | `undefined` | ID del usuario para filtrar rutas (opcional) |
| `maxRoutesToShow` | `number` | `0` | Límite de rutas a mostrar (0 = todas) |

## Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `routeSelected` | `RouteSelectionEvent` | Se emite cuando se selecciona una ruta |
| `providerSelected` | `{ route: Route; provider: usuarios }` | Se emite cuando se selecciona un proveedor |

## Servicios Utilizados

### RouteGenerationStateService
Maneja toda la lógica de estado:
- `routes$`: Observable<Route[]> - Lista de rutas
- `isLoading$`: Observable<boolean> - Estado de carga
- `error$`: Observable<string | null> - Mensajes de error
- `activeRoute$`: Observable<Route | null> - Ruta activa
- `activeProvider$`: Observable<usuarios | null> - Proveedor activo

Métodos públicos:
- `loadCompletedRoutes(userId?: string | number)`: Carga rutas del backend
- `refreshRoutes()`: Recarga las rutas
- `handleRouteSelected(event)`: Maneja selección de ruta
- `handleProviderSelected(route, provider)`: Maneja selección de proveedor
- `setActiveRoute(routeId)`: Establece ruta activa
- `setActiveProvider(provider)`: Establece proveedor activo

## Flujo de Datos

```
Backend (/api/v1/routes/completed)
        ↓
RouteOptimizationService.getCompletedRoutes()
        ↓
RouteGenerationStateService (estado reactivo)
        ↓
RouteGenerationComponent (template)
        ↓
ShowRoutesManyOptionsComponent (visualización)
```

## Interfaces Utilizadas (sin crear nuevas)

Las mismas interfaces que usa `route-builder-state.service`:

- `Route` - Modelo de ruta
- `RouteDisplayOptions` - Opciones de visualización
- `RouteSelectionEvent` - Evento de selección
- `OptimizationResult` - Resultado de optimización
- `usuarios` - Modelo de usuario/proveedor

## Ejemplo Completo con Navegación

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouteGenerationComponent } from '@shared/ui/components/route-generation';
import { RouteSelectionEvent } from '@shared/models/route';

@Component({
  selector: 'app-routes-page',
  standalone: true,
  imports: [RouteGenerationComponent],
  template: `
    <div class="container">
      <app-route-generation
        [userId]="userId"
        (routeSelected)="navigateToRouteDetail($event)"
        (providerSelected)="navigateToProvider($event)">
      </app-route-generation>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
  `]
})
export class RoutesPageComponent {
  userId?: string;

  constructor(private router: Router) {}

  navigateToRouteDetail(event: RouteSelectionEvent) {
    this.router.navigate(['/routes', event.route.id]);
  }

  navigateToProvider(event: any) {
    this.router.navigate(['/providers', event.provider.id]);
  }
}
```

## Personalización de Estilos

Los estilos están en `route-generation.component.css` y puedes sobrescribirlos:

```css
::ng-deep .route-generation {
  background: #f8f9fa;
  border-radius: 12px;
}

::ng-deep .route-generation__title {
  color: #2563eb;
  font-size: 2rem;
}
```

## Notas Importantes

1. **No crea nuevos adapters** - Usa `OptimizationResultAdapterService` existente
2. **State management** - `RouteGenerationStateService` maneja todo el estado
3. **Standalone** - Se puede importar directamente sin módulos
4. **Reactivo** - Usa Observables para actualizaciones automáticas
5. **Reutilizable** - Mismo componente para admin y turista, solo cambia el `userId`
