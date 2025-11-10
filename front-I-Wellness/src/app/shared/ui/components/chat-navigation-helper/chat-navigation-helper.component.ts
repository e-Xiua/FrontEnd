import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-chat-navigation-helper',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatToolbarModule, MatMenuModule, MatDividerModule],
  template: `
    <div class="chat-nav-helper" *ngIf="showChatNavigation">
      <mat-toolbar color="primary" class="chat-toolbar">
        <span>🚀 Sistema de Chat Habilitado</span>

        <div class="nav-actions">
          <button mat-raised-button color="accent" (click)="goToChatDemo()">
            <mat-icon>chat</mat-icon>
            Probar Chat
          </button>

          <button mat-button [matMenuTriggerFor]="navMenu">
            <mat-icon>navigation</mat-icon>
            Navegación
          </button>

          <mat-menu #navMenu="matMenu">
            <button mat-menu-item (click)="navigateTo('/proveedor')">
              <mat-icon>home</mat-icon>
              Inicio Proveedor
            </button>
            <button mat-menu-item (click)="navigateTo('/proveedor/dashboard')">
              <mat-icon>dashboard</mat-icon>
              Dashboard
            </button>
            <button mat-menu-item (click)="navigateTo('/proveedor/agregar-servicio')">
              <mat-icon>add</mat-icon>
              Agregar Servicio
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="navigateTo('/proveedor/home')">
              <mat-icon>arrow_back</mat-icon>
              Versión Legacy
            </button>
          </mat-menu>
        </div>
      </mat-toolbar>
    </div>
  `,
  styles: [`
    .chat-nav-helper {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1200;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .chat-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 48px;
      padding: 0 16px;
    }

    .nav-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    @media (max-width: 768px) {
      .chat-toolbar {
        font-size: 14px;
        padding: 0 8px;
      }

      .nav-actions {
        gap: 4px;
      }

      .nav-actions button {
        padding: 0 8px;
        min-width: auto;
      }
    }
  `]
})
export class ChatNavigationHelperComponent implements OnInit {
  showChatNavigation = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Mostrar solo para proveedores autenticados
    this.showChatNavigation = this.authService.isAuthenticated() &&
                              this.authService.getCurrentUserRole() === 'Proveedor';
  }

  goToChatDemo(): void {
    this.router.navigate(['/proveedor/chat-demo']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
