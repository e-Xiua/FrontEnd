# Provider Search Integration in Header

## Overview
El componente de búsqueda de proveedores (`ProviderSearchComponent`) ahora está integrado en el header y aparece automáticamente solo para usuarios con rol de **Proveedor**.

## Cómo Funciona

### 1. Configuración del Header Service
El `HeaderService` ya tiene configurado `showProviderSearch: true` para el rol de proveedor:

```typescript
private createProveedorHeaderConfig(): HeaderConfig {
  return {
    role: 'proveedor',
    config: {
      title: 'Panel de Proveedor',
      logoUrl: '/assets/logo.png',
      theme: 'light',
      showProviderSearch: true,  // ✅ Habilitado para proveedores
      navigationItems: [
        { label: 'Dashboard', route: '/proveedor/dashboard', icon: 'dashboard' },
        { label: 'Perfil Principal', route: '/proveedor/home', icon: 'room_service' },
        { label: 'Rutas', route: '/proveedor/rutas', icon: 'map' },
      ],
      // ...
    }
  };
}
```

### 2. Activar el Header para Proveedores
En el componente donde gestiones la autenticación del proveedor (ej. después del login), llama a:

```typescript
constructor(private headerService: HeaderService) {}

ngOnInit() {
  // Cuando el usuario inicia sesión como proveedor
  this.headerService.setHeaderForRole('proveedor');
  
  // Opcionalmente, actualiza la info del usuario
  this.headerService.updateUserInfo({
    name: 'Nombre del Proveedor',
    email: 'proveedor@ejemplo.com',
    avatar: 'url-de-foto',
    role: 'proveedor'
  });
}
```

### 3. El Header Detecta Automáticamente
El `HeaderComponent` se suscribe a los cambios de configuración y muestra el buscador automáticamente:

```typescript
// En header.component.ts
this.headerService.headerConfig$
  .pipe(takeUntil(this.destroy$))
  .subscribe((config: HeaderConfig | null) => {
    this.headerConfig = config;
    this.showProviderSearch = config?.config?.showProviderSearch ?? false;
  });
```

```html
<!-- En header.component.html -->
<div *ngIf="showProviderSearch" class="provider-search-wrapper">
  <app-provider-search
    (providerSelected)="onProviderSelected($event)"
  ></app-provider-search>
</div>
```

### 4. Navegación al Seleccionar un Proveedor
Cuando un proveedor selecciona otro proveedor desde el buscador, navega automáticamente a su perfil público:

```typescript
onProviderSelected(provider: usuarios): void {
  console.log('Proveedor seleccionado:', provider);
  
  // Navega al perfil público del proveedor seleccionado
  if (provider.id) {
    this.router.navigate(['/proveedor/perfil', provider.id]);
  }
}
```

## Flujo Completo

1. **Usuario inicia sesión como Proveedor** → Auth guard/service detecta el rol
2. **Se llama** `headerService.setHeaderForRole('proveedor')`
3. **HeaderComponent se suscribe** y detecta `showProviderSearch: true`
4. **Se renderiza** `<app-provider-search>` en el header
5. **El componente carga** todos los proveedores usando `RouteBuilderStateService`
6. **Usuario busca** un proveedor por nombre o categoría
7. **Al seleccionar**, navega a `/proveedor/perfil/:id`

## Ejemplo de Integración en Guard o Resolver

```typescript
// En tu auth.guard.ts o componente de login
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private headerService: HeaderService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const userRole = this.authService.getUserRole();
    
    // Configura el header según el rol
    switch(userRole) {
      case 'proveedor':
        this.headerService.setHeaderForRole('proveedor');
        break;
      case 'turista':
        this.headerService.setHeaderForRole('turista');
        break;
      case 'admin':
        this.headerService.setHeaderForRole('admin');
        break;
      default:
        this.headerService.setHeaderForRole('public');
    }
    
    return true;
  }
}
```

## Personalización

Para modificar cuándo se muestra el buscador, edita `header.service.ts`:

```typescript
private createProveedorHeaderConfig(): HeaderConfig {
  return {
    role: 'proveedor',
    config: {
      // ...
      showProviderSearch: true,  // Cambia a false para desactivar
      // ...
    }
  };
}
```

## Beneficios

✅ **Centralizado**: Una sola fuente de verdad para la configuración del header  
✅ **Reactivo**: Usa RxJS observables para actualizaciones automáticas  
✅ **Reutilizable**: El mismo componente puede usarse en otros contextos  
✅ **Type-safe**: Interfaces TypeScript para prevenir errores  
✅ **Testeable**: Lógica separada en servicios inyectables  

## Troubleshooting

**Problema**: El buscador no aparece  
**Solución**: Verifica que `headerService.setHeaderForRole('proveedor')` se haya llamado después del login.

**Problema**: Los proveedores no se cargan  
**Solución**: Asegúrate que el backend de `RouteBuilderStateService` esté disponible en `http://localhost:8085/api/route-processing`.

**Problema**: Error de navegación al seleccionar proveedor  
**Solución**: Verifica que la ruta `/proveedor/perfil/:id` esté definida en tus rutas de Angular.
