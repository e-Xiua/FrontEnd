import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { HeaderConfig } from '../models/header';
import { ChatLayoutService } from './chat-layout.service';
import { ChatRealtimeService } from './chat-realtime.service';

/**
 * Servicio para gestión centralizada de headers
 * Implementa el patrón Strategy para diferentes tipos de headers
 */
@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private headerConfigSubject = new BehaviorSubject<HeaderConfig | null>(null);
  public headerConfig$: Observable<HeaderConfig | null> = this.headerConfigSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router,
    private chatRealtimeService: ChatRealtimeService,
    private chatLayoutService: ChatLayoutService
  ) {}

  /**
   * Configura el header según el rol del usuario
   */
  setHeaderForRole(role: 'admin' | 'proveedor' | 'turista' | 'public'): void {
    const config = this.getHeaderConfigByRole(role);
    this.headerConfigSubject.next(config);
  }

  /**
   * Obtiene la configuración del header actual
   */
  getCurrentConfig(): HeaderConfig | null {
    return this.headerConfigSubject.value;
  }

  /**
   * Actualiza información del usuario en el header
   */
  updateUserInfo(userInfo: any): void {
    const currentConfig = this.headerConfigSubject.value;
    if (currentConfig) {
      currentConfig.config.userInfo = {
        name: userInfo.name || userInfo.nombre || 'Usuario',
        email: userInfo.email || userInfo.correo || '',
        avatar: userInfo.avatar || userInfo.foto,
        role: userInfo.role || userInfo.rol
      };
      this.headerConfigSubject.next(currentConfig);
    }
  }

  /**
   * Limpia la configuración del header
   */
  clearHeader(): void {
    this.headerConfigSubject.next(null);
  }

  /**
   * Factory method para crear configuraciones de header por rol
   */
  private getHeaderConfigByRole(role: 'admin' | 'proveedor' | 'turista' | 'public'): HeaderConfig {
    switch (role) {
      case 'admin':
        return this.createAdminHeaderConfig();
      case 'proveedor':
        return this.createProveedorHeaderConfig();
      case 'turista':
        return this.createTuristaHeaderConfig();
      default:
        return this.createPublicHeaderConfig();
    }
  }

  private createAdminHeaderConfig(): HeaderConfig {
    return {
      role: 'admin',
      config: {
        title: 'Panel de Administración',
        logoUrl: '/assets/logo.png',
        theme: 'dark',
        navigationItems: [
          { label: 'Inicio', route: '/admin/home', icon: 'home' },
          { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
          { label: 'Usuarios', route: '/admin/visitantes', icon: 'people' },
          { label: 'Proveedores', route: '/admin/proveedores', icon: 'business' },
          { label: 'Rutas', route: '/admin/rutas', icon: 'map' },
          { label: 'Reportes del Sistema', route: '/metricas', icon: 'bar_chart' },
          { label: 'Tareas', route: '/tasks', icon: 'task_alt' },
          { label: 'Calendario', route: '/calendario', icon: 'event' },
          { label: 'Temas', route: '/temas', icon: 'explore' },
          { label: 'Buscador', route: '/buscador-web', icon: 'search' },
          { label: 'Observatorio', route: '/observatorio', icon: 'cloud_queue' },
        ],
        actions: [
          {
            id: 'profile',
            label: 'Perfil',
            icon: 'account_circle',
            action: () => this.navigateToProfile('admin')
          },
          {
            id: 'logout',
            label: 'Cerrar Sesión',
            icon: 'logout',
            action: () => this.logout()
          }
        ]
      }
    };
  }

  private createProveedorHeaderConfig(): HeaderConfig {
    return {
      role: 'proveedor',
      config: {
        title: 'e-Xiua',
        logoUrl: '/assets/logo.png',
        theme: 'light',
        showProviderSearch: true,
        navigationItems: [
          { label: 'Inicio', route: '/proveedor/home', icon: 'home' },
          { label: 'Dashboard', route: '/proveedor/dashboard', icon: 'dashboard' },
          { label: 'Rutas', route: '/proveedor/rutas', icon: 'map' },
          { label: 'Tareas', route: '/tasks', icon: 'task_alt' },
          { label: 'Calendario', route: '/calendario', icon: 'event' },
          { label: 'Temas', route: '/temas', icon: 'explore' },
          { label: 'Buscador', route: '/buscador-web', icon: 'search' },
          { label: 'Observatorio', route: '/observatorio', icon: 'cloud_queue' },
        ],
        actions: [
          {
            id: 'profile',
            label: 'Mi Perfil',
            icon: 'account_circle',
            action: () => this.navigateToProfile('proveedor')
          },
          {
            id: 'logout',
            label: 'Cerrar Sesión',
            icon: 'logout',
            action: () => this.logout()
          }
        ]
      }
    };
  }

  private createTuristaHeaderConfig(): HeaderConfig {
    return {
      role: 'turista',
      config: {
        title: 'e-Xiua',
        logoUrl: '/assets/logo.png',
        theme: 'light',
        navigationItems: [
          { label: 'Inicio', route: '/turista/home', icon: 'home' },
          { label: 'Consultar Rutas', route: '/turista/reservar-rutas', icon: 'map' },
          { label: 'Reservas', route: '/turista/reservas', icon: 'event' },
          { label: 'Temas', route: '/temas', icon: 'explore' },
          { label: 'Buscador', route: '/buscador-web', icon: 'search' },
          { label: 'Observatorio', route: '/observatorio', icon: 'cloud_queue' },
        ],
        actions: [
          {
            id: 'profile',
            label: 'Perfil',
            icon: 'account_circle',
            action: () => this.navigateToProfile('turista')
          },
          {
            id: 'logout',
            label: 'Cerrar Sesión',
            icon: 'logout',
            action: () => this.logout()
          }
        ]
      }
    };
  }

  private createPublicHeaderConfig(): HeaderConfig {
    return {
      role: 'public',
      config: {
        title: 'e-Xiua',
        logoUrl: '/assets/logo.png',
        theme: 'light',
        navigationItems: [
          { label: 'Inicio', route: '/', icon: 'home' },
          { label: 'Temas', route: '/temas', icon: 'explore' },
          { label: 'Buscador Integrado', route: '/buscador-web', icon: 'search' },
          { label: 'Observatorio Ambiental', route: '/observatorio', icon: 'cloud_queue' },
        ],
        actions: [
          {
            id: 'login',
            label: 'Iniciar Sesión',
            icon: 'login',
            action: () => this.router.navigate(['/login'])
          },
          {
            id: 'register',
            label: 'Registrarse',
            icon: 'person_add',
            action: () => this.router.navigate(['/registro'])
          }
        ]
      }
    };
  }

  private navigateToProfile(role: string): void {

    this.authService.getCurrentUserId().subscribe({

      next: (userId) => {

        console.log('Navegando al perfil del usuario con ID:', userId);

        if (userId) {

          switch (role) {
            case 'admin':
              this.router.navigate(['/admin/perfil', userId]);
              break;
            case 'proveedor':
              this.router.navigate(['/proveedor/perfil', userId]);
              break;
            case 'turista':
              this.router.navigate(['/turista/perfil', userId]);
              break;
          }
        }
      },
      error: (err) => {
        console.error('No se pudo obtener el ID del usuario para navegar al perfil:', err);

        this.router.navigate(['/home']);
      }
    });
  }

  private logout(): void {
    console.log('[HeaderService] Cerrando sesión y limpiando datos de chat...');

    // 1. Desconectar servicio en tiempo real (WebSocket/STOMP)
    this.chatRealtimeService.disconnect();

    // 2. Limpiar estado del chat layout (conversaciones, contactos, mensajes)
    this.chatLayoutService.clearAllData();

    // 3. Cerrar sesión en AuthService
    this.authService.logout();

    // 4. Limpiar configuración del header
    this.clearHeader();

    // 5. Navegar a la página principal
    this.router.navigate(['/']);

    console.log('[HeaderService] ✅ Sesión cerrada y datos limpiados');
  }
}
