import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FloatingTabComponent } from '../floating-tab/floating-tab.component';

@Component({
  selector: 'app-floating-tabs-demo',
  standalone: true,
  imports: [CommonModule, FloatingTabComponent],
  template: `
    <div class="demo-container">
      <h3>Floating Tabs Demo</h3>
      <p>Esta demostración muestra cómo funcionan los tabs flotantes:</p>

      <!-- Controles de demostración -->
      <div class="demo-controls">
        <button (click)="toggleProviderTab()">
          {{ showProviderTab ? 'Ocultar' : 'Mostrar' }} Tab Proveedores
        </button>
        <button (click)="toggleMessageTab()">
          {{ showMessageTab ? 'Ocultar' : 'Mostrar' }} Tab Mensajes
        </button>
      </div>

      <!-- Demo tabs -->
      <app-floating-tab
        label="Proveedores"
        orientation="vertical"
        position="left"
        [visible]="showProviderTab"
        iconClass="fas fa-store"
        customAriaLabel="Mostrar sidebar con lista de proveedores (Demo)"
        (tabClick)="onProviderTabClick()">
      </app-floating-tab>

      <app-floating-tab
        label="Chat"
        orientation="horizontal"
        position="bottom"
        [visible]="showMessageTab"
        iconClass="fas fa-comments"
        customAriaLabel="Mostrar modal de chat con contactos (Demo)"
        (tabClick)="onMessageTabClick()">
      </app-floating-tab>      <!-- Estado actual -->
      <div class="demo-status">
        <h4>Estado actual:</h4>
        <p>Tab Proveedores (Sidebar): {{ showProviderTab ? 'Visible' : 'Oculto' }}</p>
        <p>Tab Chat (Modal): {{ showMessageTab ? 'Visible' : 'Oculto' }}</p>
        <p *ngIf="lastTabClick">Último clic: {{ lastTabClick }}</p>
        <div class="functionality-note">
          <small>
            <strong>Proveedores:</strong> Sidebar izquierdo con lista filtrable de proveedores<br>
            <strong>Chat:</strong> Modal inferior-derecho con contactos y mensajes paginados
          </small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .demo-controls {
      margin: 20px 0;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .demo-controls button {
      padding: 10px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .demo-controls button:hover {
      background: #0056b3;
    }

    .demo-status {
      margin: 20px 0;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }

    .demo-status h4 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .demo-status p {
      margin: 5px 0;
      color: #666;
    }

    .functionality-note {
      margin-top: 12px;
      padding: 8px;
      background: #e3f2fd;
      border-radius: 4px;
      border-left: 3px solid #2196f3;
    }

    .functionality-note small {
      color: #555;
      line-height: 1.5;
    }

    h3 {
      color: #333;
      margin-bottom: 10px;
    }
  `]
})
export class FloatingTabsDemoComponent {
  showProviderTab = true;
  showMessageTab = true;
  lastTabClick = '';

  toggleProviderTab(): void {
    this.showProviderTab = !this.showProviderTab;
  }

  toggleMessageTab(): void {
    this.showMessageTab = !this.showMessageTab;
  }

  onProviderTabClick(): void {
    this.lastTabClick = 'Tab Proveedores (Sidebar)';
    console.log('Provider sidebar tab clicked!');
  }

  onMessageTabClick(): void {
    this.lastTabClick = 'Tab Chat (Modal)';
    console.log('Chat modal tab clicked!');
  }
}
