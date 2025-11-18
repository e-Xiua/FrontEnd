import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';
import { BaseHeader, HeaderAction, HeaderConfig } from '../../models/header';
import { usuarios } from '../../models/usuarios';
import { HeaderService } from '../../services/header.service';
import { ProviderSearchComponent } from '../../ui/components/provider-search/provider-search.component';

/**
 * Componente de header reutilizable usando el patrón Strategy
 * Se adapta automáticamente según el rol del usuario
 */
@Component({
  selector: 'app-universal-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    ProviderSearchComponent
  ],
  template: `
    <mat-toolbar [class]="getThemeClass()">
      <!-- Logo y título -->
      <div class="header-brand">
        <img *ngIf="config?.logoUrl"
             [src]="config?.logoUrl"
             [alt]="config?.title || 'Logo'"
             class="header-logo">
        <span class="header-title">{{ config?.title }}</span>
      </div>

      <!-- Navegación principal -->
      <nav class="header-navigation" *ngIf="config?.navigationItems?.length">
        <a *ngFor="let item of config?.navigationItems"
           [routerLink]="item.route"
           routerLinkActive="active"
           class="nav-link"
           mat-button>
          <mat-icon *ngIf="item.icon">{{ item.icon }}</mat-icon>
          {{ item.label }}
        </a>
      </nav>

      <!-- Búsqueda de proveedores (solo para proveedores) -->
      <div class="provider-search-wrapper" *ngIf="config?.showProviderSearch">
        <app-provider-search
          (providerSelected)="onProviderSelected($event)">
        </app-provider-search>
      </div>

      <!-- Spacer -->
      <span class="spacer"></span>

      <!-- Información del usuario -->
      <div class="user-info" *ngIf="config?.userInfo">
        <span class="user-name">{{ config?.userInfo?.name }}</span>
        <img *ngIf="config?.userInfo?.avatar"
             [src]="config?.userInfo?.avatar"
             class="user-avatar">
      </div>

      <!-- Acciones del header -->
      <div class="header-actions" *ngIf="config?.actions?.length">
        <button *ngFor="let action of config?.actions"
                mat-icon-button
                [matTooltip]="action.label"
                (click)="executeAction(action)">
          <mat-icon>{{ action.icon }}</mat-icon>
        </button>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-logo {
      height: 32px;
      width: auto;
    }

    .header-title {
      font-size: 1.25rem;
      font-weight: 500;
    }

    .header-navigation {
      display: flex;
      gap: 0.5rem;
      margin-left: 2rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .provider-search-wrapper {
      margin-left: 2rem;
      max-width: 400px;
      flex-shrink: 0;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-right: 1rem;
    }

    .user-name {
      font-size: 0.875rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .header-actions {
      display: flex;
      gap: 0.25rem;
    }

    /* Temas */
    .theme-light {
    }

    .theme-dark {
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-navigation {
        display: none;
      }

      .provider-search-wrapper {
        display: none;
      }

      .user-name {
        display: none;
      }

      .header-title {
        font-size: 1rem;
      }
    }
  `]
})
export class UniversalHeaderComponent implements OnInit, OnDestroy {
  @Input() role?: 'admin' | 'proveedor' | 'turista' | 'public';
  @Input() customConfig?: BaseHeader;

  config: BaseHeader | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly headerService: HeaderService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Si se proporciona un rol, configurar el header
    if (this.role) {
      this.headerService.setHeaderForRole(this.role);
    }

    // Si se proporciona configuración personalizada, usarla
    if (this.customConfig) {
      this.config = this.customConfig;
    } else {
      // Suscribirse a cambios en la configuración del header
      this.headerService.headerConfig$
        .pipe(takeUntil(this.destroy$))
        .subscribe((headerConfig: HeaderConfig | null) => {
          this.config = headerConfig?.config || null;
        });
    }

    // Actualizar información del usuario si está autenticado
    if (this.authService.isAuthenticated()) {
      const userInfo = this.authService.getCurrentUser();
      if (userInfo) {
        this.headerService.updateUserInfo(userInfo);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  executeAction(action: HeaderAction): void {
    if (action.action) {
      action.action();
    }
  }

  getThemeClass(): string {
    const theme = this.config?.theme || 'light';
    return `theme-${theme}`;
  }

  onProviderSelected(provider: usuarios): void {
    console.log('✅ Proveedor seleccionado desde el header:', provider);
    console.log('  - ID:', provider.id);
    console.log('  - Nombre:', provider.nombre);
    console.log('  - Categorías:', provider.proveedorInfo?.categories);
    
    // Navegar al perfil del proveedor seleccionado
    if (provider.id) {
      const targetRoute = '/proveedor/ver-perfil/' + provider.id;
      console.log('🔗 Navegando a:', targetRoute);
      
      this.router.navigate(['/proveedor/ver-perfil', provider.id]).then(success => {
        if (success) {
          console.log('✅ Navegación exitosa');
        } else {
          console.error('❌ Error en la navegación');
        }
      }).catch(error => {
        console.error('❌ Error al navegar:', error);
      });
    } else {
      console.warn('⚠️ El proveedor no tiene ID');
    }
  }
}
