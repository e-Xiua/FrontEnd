import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { HeaderConfig } from '../models/header';

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
    private router: Router
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
          { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
          { label: 'Usuarios', route: '/admin/visitantes', icon: 'people' },
          { label: 'Proveedores', route: '/admin/proveedores', icon: 'business' },
          { label: 'Servicios', route: '/admin/servicios', icon: 'room_service' },
          { label: 'Rutas', route: '/admin/rutas', icon: 'map' },
          { label: 'Reportes', route: '/admin/reportes', icon: 'bar_chart' },
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
        title: 'Panel de Proveedor',
        logoUrl: '/assets/logo.png',
        theme: 'light',
        navigationItems: [
          { label: 'Dashboard', route: '/proveedor/dashboard', icon: 'dashboard' },
          { label: 'Servicios', route: '/proveedor/home', icon: 'room_service' },
          { label: 'Agregar Servicio', route: '/proveedor/agregar-servicio', icon: 'add_business' },
          { label: 'Chat', route: '/proveedor/chat-demo', icon: 'chat' },
          { label: 'Rutas', route: '/proveedor/rutas', icon: 'map' },
        ],
        actions: [
          {
            id: 'profile',
            label: 'Perfil',
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
        title: 'I-Wellness',
        logoUrl: '/assets/logo.png',
        theme: 'light',
        navigationItems: [
          { label: 'Inicio', route: '/turista/home', icon: 'home' },
          { label: 'Reservar Rutas', route: '/turista/reservar-rutas', icon: 'map' },
          { label: 'Reservas', route: '/turista/reservas', icon: 'event' },
          { label: 'Preferencias', route: '/turista/preferencias', icon: 'tune' },
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
        title: 'I-Wellness',
        logoUrl: '/assets/logo.png',
        theme: 'light',
        navigationItems: [
          { label: 'Inicio', route: '/', icon: 'home' },
          { label: 'Temas', route: '/temas', icon: 'explore' },
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
    const userId = this.authService.getCurrentUserId();
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
  }

  private logout(): void {
    this.authService.logout();
    this.clearHeader();
    this.router.navigate(['/']);
  }
}
