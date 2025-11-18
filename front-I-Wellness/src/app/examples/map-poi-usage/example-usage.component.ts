import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { usuarios } from '../../shared/models/usuarios';
import { MapPoiComponent } from '../../shared/ui/components/map-poi/map-poi.component';

@Component({
  selector: 'app-example-usage',
  standalone: true,
  imports: [CommonModule, FormsModule, MapPoiComponent],
  template: `
    <div class="example-container">
      <h2>Ejemplo de uso del Map-POI Component Refactorizado</h2>

      <!-- Uso básico sin rastreo de rutas -->
      <section class="example-section">
        <h3>Mapa básico con proveedores</h3>
        <app-map-poi
          [providers]="providers"
          [showCarousel]="true"
          [showProviderCard]="true"
          [showRoutes]="true"
          [autoSelectFirst]="true"
          mapId="basicMap"
          (providerSelected)="onProviderSelected($event)"
          (mapInitialized)="onMapInitialized()">
        </app-map-poi>
      </section>

      <!-- Uso avanzado con rastreo de rutas dinámicas -->
      <section class="example-section">
        <h3>Mapa con rastreo de rutas dinámicas (Proveedor)</h3>
        <app-map-poi
          [providers]="providers"
          [showCarousel]="true"
          [showProviderCard]="false"
          [showRoutes]="true"
          [enableRouteTracking]="true"
          [currentUserId]="currentProviderId"
          mapId="trackingMap"
          (providerSelected)="onProviderSelected($event)"
          (userPositionChanged)="onUserPositionChanged($event)"
          (mapInitialized)="onMapInitialized()">
        </app-map-poi>

        <!-- Controles para el rastreo -->
        <div class="tracking-controls">
          <button
            (click)="toggleTracking()"
            [class.active]="isTracking"
            class="tracking-btn">
            {{ isTracking ? 'Detener Rastreo' : 'Iniciar Rastreo' }}
          </button>

          <button
            (click)="simulateMovement()"
            [disabled]="!isTracking"
            class="tracking-btn simulate-btn">
            Simular Movimiento
          </button>

          <div class="tracking-info" *ngIf="lastPosition">
            <p>Última posición: {{ lastPosition[0].toFixed(6) }}, {{ lastPosition[1].toFixed(6) }}</p>
            <p>Última actualización: {{ lastUpdate | date:'medium' }}</p>
            <p>✅ Rutas dibujadas automáticamente</p>
            <p>✅ Zoom automático al usuario</p>
          </div>
        </div>
      </section>

      <!-- Configuraciones personalizadas -->
      <section class="example-section">
        <h3>Configuración personalizada</h3>
        <div class="config-controls">
          <label>
            <input type="checkbox" [(ngModel)]="showCarousel" /> Mostrar Carrusel
          </label>
          <label>
            <input type="checkbox" [(ngModel)]="showProviderCard" /> Mostrar Tarjeta de Proveedor
          </label>
          <label>
            <input type="checkbox" [(ngModel)]="showRoutes" /> Mostrar Rutas
          </label>
          <label>
            <input type="checkbox" [(ngModel)]="enableRouteTracking" /> Habilitar Rastreo
          </label>
        </div>

        <app-map-poi
          [providers]="providers"
          [showCarousel]="showCarousel"
          [showProviderCard]="showProviderCard"
          [showRoutes]="showRoutes"
          [enableRouteTracking]="enableRouteTracking"
          [currentUserId]="currentProviderId"
          mapId="customMap"
          [config]="customMapConfig"
          (providerSelected)="onProviderSelected($event)">
        </app-map-poi>
      </section>
    </div>
  `,
  styles: [`
    .example-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .example-section {
      margin-bottom: 3rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background-color: #f9fafb;
    }

    .tracking-controls {
      margin-top: 1rem;
      padding: 1rem;
      background-color: white;
      border-radius: 0.5rem;
      border: 1px solid #d1d5db;
    }

    .tracking-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.25rem;
      background-color: #3b82f6;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .tracking-btn:hover {
      background-color: #2563eb;
    }

    .tracking-btn.active {
      background-color: #ef4444;
    }

    .tracking-btn.active:hover {
      background-color: #dc2626;
    }

    .simulate-btn {
      background-color: #10b981;
    }

    .simulate-btn:hover:not(:disabled) {
      background-color: #059669;
    }

    .simulate-btn:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }

    .tracking-info {
      margin-top: 1rem;
      padding: 0.5rem;
      background-color: #f3f4f6;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .config-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background-color: white;
      border-radius: 0.5rem;
      border: 1px solid #d1d5db;
    }

    .config-controls label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
  `]
})
export class ExampleUsageComponent implements OnInit {
  providers: usuarios[] = [];
  currentProviderId = 'provider-123'; // ID del proveedor actual
  isTracking = false;
  lastPosition: [number, number] | null = null;
  lastUpdate: Date | null = null;

  // Configuraciones del mapa
  showCarousel = true;
  showProviderCard = true;
  showRoutes = true;
  enableRouteTracking = false;

  customMapConfig = {
    center: [9.9281, -84.0907] as [number, number], // San José, Costa Rica
    zoom: 12,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  ngOnInit(): void {
    this.loadMockProviders();
  }

  private loadMockProviders(): void {
    // Datos de ejemplo
    this.providers = [
      {
        id: 1,
        nombre: 'Hotel Belmar',
        correo: 'info@hotelbelmar.net',
        foto: 'https://example.com/hotel1.jpg',
        proveedorInfo: {
          nombre_empresa: 'Hotel Belmar',
          latitud: 10.263,
          longitud: -84.623,
          categoria: 'Hospedaje',
          certificaciones: 'Certificado de Sostenibilidad Turística'
        }
      },
      {
        id: 2,
        nombre: 'Aventuras Monteverde',
        correo: 'info@aventurasmonteverde.com',
        foto: 'https://example.com/aventuras.jpg',
        proveedorInfo: {
          nombre_empresa: 'Aventuras Monteverde',
          latitud: 10.311,
          longitud: -84.816,
          categoria: 'Tours y Actividades',
          certificaciones: 'Guías certificados por ICT'
        }
      },
      {
        id: 3,
        nombre: 'Spa Natural Wellness',
        correo: 'contacto@spawellness.cr',
        foto: 'https://example.com/spa.jpg',
        proveedorInfo: {
          nombre_empresa: 'Spa Natural Wellness',
          latitud: 10.203,
          longitud: -84.509,
          categoria: 'Wellness y Spa',
          certificaciones: 'Terapeutas certificados internacionalmente'
        }
      }
    ];
  }

  onProviderSelected(provider: any): void {
    console.log('Proveedor seleccionado:', provider);
  }

  onMapInitialized(): void {
    console.log('Mapa inicializado correctamente');
  }

  onUserPositionChanged(position: [number, number]): void {
    this.lastPosition = position;
    this.lastUpdate = new Date();
    console.log('Posición del usuario actualizada:', position);
  }

  toggleTracking(): void {
    this.isTracking = !this.isTracking;
    this.enableRouteTracking = this.isTracking;

    if (this.isTracking) {
      console.log('Iniciando rastreo de ruta para proveedor:', this.currentProviderId);
    } else {
      console.log('Deteniendo rastreo de ruta');
    }
  }

  simulateMovement(): void {
    if (!this.isTracking) return;

    // Simular movimiento aleatorio cerca de la posición actual
    const basePosition = this.lastPosition || [10.263, -84.623]; // Monteverde como ejemplo

    // Generar movimiento aleatorio de hasta 0.001 grados (aproximadamente 100 metros)
    const deltaLat = (Math.random() - 0.5) * 0.002;
    const deltaLng = (Math.random() - 0.5) * 0.002;

    const newPosition: [number, number] = [
      basePosition[0] + deltaLat,
      basePosition[1] + deltaLng
    ];

    // Simular la actualización de posición
    this.onUserPositionChanged(newPosition);

    console.log('Movimiento simulado hacia:', newPosition);
  }
}
