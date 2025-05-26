// src/app/core/services/auth/authorization.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  constructor(private authService: AuthService) {}

  canAccessProfile(requestedId: number): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      return of(false);
    }

    const currentRole = this.authService.getCurrentUserRole();
    
    // Si es admin, puede acceder a cualquier perfil
    if (currentRole === 'Admin') {
      return of(true);
    }

    // Si no es admin, verificar si es su propio perfil
    return this.authService.getCurrentUserId().pipe(
      map(currentUserId => currentUserId === requestedId),
      catchError(() => of(false))
    );
  }

  isAdmin(): boolean {
    return this.authService.getCurrentUserRole() === 'Admin';
  }

  isTurista(): boolean {
    return this.authService.getCurrentUserRole() === 'Turista';
  }

  isProveedor(): boolean {
    return this.authService.getCurrentUserRole() === 'Proveedor';
  }
}