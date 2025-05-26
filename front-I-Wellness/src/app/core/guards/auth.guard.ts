// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

// Guard para rutas que requieren autenticación
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir al login si no está autenticado
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// Guard para rutas que requieren rol de Turista
export const turistaGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getCurrentUserRole();
  if (authService.isAuthenticated() && (role === 'Turista' || role === 'Admin')) {
    return true;
  }

  // Si está autenticado pero no es turista, redirigir según su rol
  if (authService.isAuthenticated()) {
    switch (authService.getCurrentUserRole()) {
      case 'Proveedor':
        router.navigate(['/homeproveedor']);
        break;
      case 'Admin':
        router.navigate(['/homeadmin']);
        break;
      default:
        router.navigate(['/login']);
    }
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};

// Guard para rutas que requieren rol de Proveedor
export const proveedorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getCurrentUserRole();
  if (authService.isAuthenticated() && (role === 'Proveedor' || role === 'Admin')) {
    return true;
  }

  // Si está autenticado pero no es proveedor, redirigir según su rol
  if (authService.isAuthenticated()) {
    switch (authService.getCurrentUserRole()) {
      case 'Turista':
        router.navigate(['/hometurista']);
        break;
      case 'Admin':
        router.navigate(['/homeadmin']);
        break;
      default:
        router.navigate(['/login']);
    }
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};

// Guard para rutas que requieren rol de Administrador
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.getCurrentUserRole() === 'Admin') {
    return true;
  }

  // Si está autenticado pero no es admin, redirigir según su rol
  if (authService.isAuthenticated()) {
    switch (authService.getCurrentUserRole()) {
      case 'Turista':
        router.navigate(['/hometurista']);
        break;
      case 'Proveedor':
        router.navigate(['/homeproveedor']);
        break;
      default:
        router.navigate(['/login']);
    }
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};
