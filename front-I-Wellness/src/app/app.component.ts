import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth/auth.service';
import { UniversalHeaderComponent } from './shared/components/universal-header/universal-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UniversalHeaderComponent,
  ],
  template: `
    <!-- Header público/dinámico solo para rutas públicas -->
    <app-universal-header
      *ngIf="showPublicHeader"
      [role]="userRole">
    </app-universal-header>

    <!-- Router outlet principal - los layouts manejarán sus propios headers -->
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title: string = 'front-I-Wellness';
  showPublicHeader = true;
  userRole: 'admin' | 'proveedor' | 'turista' | 'public' = 'public';

  private publicRoutes = [
    '',
    'temas',
    'registro',
    'login',
    'registroturista',
    'recuperar',
    'restablecer',
    'registroproveedor',
    'buscador-web',
    'observatorio',
    'metricas',
    'calendario',
    'tasks',
    'tareas'
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Limpiar almacenamiento al iniciar nueva sesión
    if (!sessionStorage.getItem('sessionStarted')) {
      localStorage.removeItem('rol');
      sessionStorage.setItem('sessionStarted', 'true');
    }
  }

  ngOnInit(): void {
    // Escuchar cambios de ruta para actualizar visibilidad del header público
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePublicHeaderVisibility(event.url);
        this.updateUserRole();
      });

    // Verificar ruta inicial
    this.updatePublicHeaderVisibility(this.router.url);
    this.updateUserRole();
  }

  private updatePublicHeaderVisibility(url: string): void {
    const path = url.split('/')[1] || ''; // Obtener primer segmento de la URL
    this.showPublicHeader = this.publicRoutes.includes(path);
  }

  private updateUserRole(): void {
    // Determinar el rol del usuario para el header
    if (this.authService.isAuthenticated()) {
      const rol = localStorage.getItem('rol');
      console.log('🔍 Usuario autenticado, rol:', rol);
      switch (rol) {
        case 'Admin':
          this.userRole = 'admin';
          break;
        case 'Proveedor':
          this.userRole = 'proveedor';
          break;
        case 'Turista':
          this.userRole = 'turista';
          break;
        default:
          console.warn('⚠️ Rol no reconocido, usando public');
          this.userRole = 'public';
      }
    } else {
      console.log('👤 Usuario NO autenticado, usando public header');
      this.userRole = 'public';
    }
    console.log('✅ Header role actualizado a:', this.userRole);
  }
}
