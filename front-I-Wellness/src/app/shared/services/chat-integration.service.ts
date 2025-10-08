import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { ChatLayoutService } from '../../shared/services/chat-layout.service';

@Injectable({
  providedIn: 'root'
})
export class ChatIntegrationService {

  constructor(
    private authService: AuthService,
    private chatLayoutService: ChatLayoutService,
    private router: Router
  ) {}

  /**
   * Inicializa el chat para proveedores autenticados
   */
  initializeChatForProvider(): boolean {
    if (!this.authService.isAuthenticated()) {
      console.warn('Chat: Usuario no autenticado');
      return false;
    }

    const userRole = this.authService.getCurrentUserRole();
    if (userRole !== 'Proveedor') {
      console.warn('Chat: Usuario no es proveedor', userRole);
      return false;
    }

    // Configurar el chat con valores por defecto para proveedores
    this.chatLayoutService.showSidebar();
    console.log('Chat: Inicializado correctamente para proveedor');
    return true;
  }

  /**
   * Deshabilita el chat al salir de rutas de proveedor
   */
  disableChat(): void {
    this.chatLayoutService.reset();
    console.log('Chat: Deshabilitado');
  }

  /**
   * Verifica y redirige según el rol del usuario
   */
  checkRoleAndRedirect(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const userRole = this.authService.getCurrentUserRole();
    switch (userRole) {
      case 'Proveedor':
        // Usuario correcto, no hacer nada
        break;
      case 'Turista':
        this.router.navigate(['/turista/home']);
        break;
      case 'Admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  /**
   * Obtiene información del usuario actual para el chat
   */
  getCurrentUserInfo(): any {
    if (!this.authService.isAuthenticated()) {
      return null;
    }

    // Obtener información del usuario desde localStorage o API
    const token = localStorage.getItem('token');
    const userRole = this.authService.getCurrentUserRole();

    return {
      token,
      role: userRole,
      isProvider: userRole === 'Proveedor'
    };
  }

  /**
   * Maneja errores de navegación relacionados con el chat
   */
  handleNavigationError(error: any): void {
    console.error('Chat Navigation Error:', error);

    // Lógica de fallback
    const userRole = this.authService.getCurrentUserRole();
    switch (userRole) {
      case 'Proveedor':
        this.router.navigate(['/proveedor/home']); // Nueva ruta con layout
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
