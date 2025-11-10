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
import { HeaderService } from '../../services/header.service';

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
    MatTooltipModule
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
  private destroy$ = new Subject<void>();

  constructor(
    private headerService: HeaderService,
    private authService: AuthService,
    private router: Router
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
}
