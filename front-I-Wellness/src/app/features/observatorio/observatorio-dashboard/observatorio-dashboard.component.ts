import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ObservatorioService } from '../../../shared/services/observatorio.service';
import { UniversalHeaderComponent } from '../../../shared/components/universal-header/universal-header.component';
import { 
  ClimaCurrent, 
  UVCurrent, 
  VolcanoStatus, 
  EventsRecent 
} from '../../../shared/models/observatorio.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-observatorio-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, UniversalHeaderComponent],
  templateUrl: './observatorio-dashboard.component.html',
  styleUrls: ['./observatorio-dashboard.component.css']
})
export class ObservatorioDashboardComponent implements OnInit {
  // Estado de carga
  loading = true;
  error: string | null = null;
  lastUpdate: Date = new Date();
  userRole: 'admin' | 'proveedor' | 'turista' | 'public' = 'public';

  // Datos del observatorio
  climaData: ClimaCurrent | null = null;
  uvData: UVCurrent | null = null;
  volcanoData: VolcanoStatus | null = null;
  eventsData: EventsRecent | null = null;

  constructor(
    private observatorioService: ObservatorioService,
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // Determinar el rol del usuario para el header
    if (this.authService.isAuthenticated()) {
      const rol = localStorage.getItem('rol');
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
          this.userRole = 'public';
      }
    } else {
      this.userRole = 'public';
    }

    this.loadObservatorioData();
    
    // Actualizar datos cada 10 minutos
    setInterval(() => {
      this.loadObservatorioData();
    }, 600000);
  }

  loadObservatorioData(): void {
    this.loading = true;
    this.error = null;

    // Cargar todos los datos en paralelo
    forkJoin({
      clima: this.observatorioService.getCurrentWeather(10.4675, -84.6436), // La Fortuna coords
      uv: this.observatorioService.getUVCurrent(),
      volcano: this.observatorioService.getVolcanoStatus(),
      events: this.observatorioService.getEventsRecent(5)
    }).subscribe({
      next: (data) => {
        this.climaData = data.clima;
        this.uvData = data.uv;
        this.volcanoData = data.volcano;
        this.eventsData = data.events;
        this.lastUpdate = new Date();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando datos del observatorio:', err);
        this.error = 'Error al cargar los datos del observatorio';
        this.loading = false;
      }
    });
  }

  // Métodos auxiliares para UI
  getTemperatureIcon(): string {
    if (!this.climaData?.data) return 'thermostat';
    const temp = this.climaData.data.temperature;
    if (temp >= 30) return 'wb_sunny';
    if (temp >= 20) return 'wb_cloudy';
    return 'ac_unit';
  }

  getUVColor(): string {
    if (!this.uvData?.data) return '#gray';
    const uv = this.uvData.data.uv_index;
    if (uv <= 2) return '#4CAF50'; // Verde - Bajo
    if (uv <= 5) return '#FFEB3B'; // Amarillo - Moderado
    if (uv <= 7) return '#FF9800'; // Naranja - Alto
    if (uv <= 10) return '#F44336'; // Rojo - Muy Alto
    return '#9C27B0'; // Morado - Extremo
  }

  getVolcanoStatusColor(): string {
    if (!this.volcanoData?.data) return '#gray';
    const status = this.volcanoData.data.alert_level?.toLowerCase();
    if (status?.includes('verde') || status?.includes('normal')) return '#4CAF50';
    if (status?.includes('amarillo') || status?.includes('precaución')) return '#FFEB3B';
    if (status?.includes('naranja')) return '#FF9800';
    if (status?.includes('rojo')) return '#F44336';
    return '#2196F3';
  }

  getVolcanoStatusIcon(): string {
    if (!this.volcanoData?.data) return 'landscape';
    if (this.volcanoData.data.tourism_safe) return 'check_circle';
    return 'warning';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refreshData(): void {
    this.loadObservatorioData();
  }

  volverAlInicio(): void {
    // Si está autenticado, redirigir según el rol
    if (this.authService.isAuthenticated()) {
      const userRole = localStorage.getItem('rol');
      switch (userRole) {
        case 'TURISTA':
          this.router.navigate(['/turista/home']);
          break;
        case 'PROVEEDOR':
          this.router.navigate(['/proveedor/home']);
          break;
        case 'ADMIN':
          this.router.navigate(['/admin/dashboard']);
          break;
        default:
          this.router.navigate(['/']);
      }
    } else {
      // Si no está autenticado, ir a la landing
      this.router.navigate(['/']);
    }
  }
}
