import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UniversalHeaderComponent } from '../../../../shared/components/universal-header/universal-header.component';

@Component({
  selector: 'app-turista-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UniversalHeaderComponent],
  template: `
    <app-universal-header role="turista"></app-universal-header>
    <main class="turista-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .turista-content {
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
export class TuristaLayoutComponent {}
