import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-proveedor-chat-demo',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="demo-container">
      <mat-card class="demo-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>chat</mat-icon>
            Sistema de Chat Integrado
          </mat-card-title>
          <mat-card-subtitle>Demostración del chat para proveedores</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p>¡Bienvenido al nuevo sistema de chat integrado!</p>

          <div class="features-list">
            <h3>Características disponibles:</h3>
            <ul>
              <li>✅ Sidebar con lista de contactos</li>
              <li>✅ Modal flotante para conversaciones</li>
              <li>✅ Filtros y búsqueda de proveedores</li>
              <li>✅ Paginación de resultados</li>
              <li>✅ Animaciones suaves con Strategy Pattern</li>
              <li>✅ Diseño responsive</li>
            </ul>
          </div>

          <div class="navigation-demo">
            <h3>Navegación de prueba:</h3>
            <div class="nav-buttons">
              <button mat-stroked-button (click)="navigateTo('/proveedor/home')">
                <mat-icon>home</mat-icon>
                Inicio
              </button>
              <button mat-stroked-button (click)="navigateTo('/proveedor/dashboard')">
                <mat-icon>dashboard</mat-icon>
                Dashboard
              </button>
              <button mat-stroked-button (click)="navigateTo('/proveedor/agregar-servicio')">
                <mat-icon>add</mat-icon>
                Agregar Servicio
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .demo-card {
      margin-bottom: 2rem;
    }

    .features-list ul {
      list-style: none;
      padding: 0;
    }

    .features-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .nav-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .nav-buttons button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .demo-container {
        padding: 1rem;
      }

      .nav-buttons {
        flex-direction: column;
      }

      .nav-buttons button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ProveedorChatDemoComponent {

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
