import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UniversalHeaderComponent } from '../../../../shared/components/universal-header/universal-header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UniversalHeaderComponent],
  template: `
    <app-universal-header role="admin"></app-universal-header>
    <main class="admin-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .admin-content {
      padding: 1rem;
      min-height: calc(100vh - 80px);
      background: transparent;
    }

    /* Asegurar transparencia */
    :host {
      background: transparent;
    }
  `]
})
export class AdminLayoutComponent {}
