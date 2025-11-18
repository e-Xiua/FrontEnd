import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Route } from '../../../../shared/models/route';
import { usuarios } from '../../../../shared/models/usuarios';
import { RouteDataService } from '../../../../shared/services/route-data.service';
import { MapConfig, MapPoiComponent } from '../../../../shared/ui/components/map-poi/map-poi.component';
import { EnrichedProviderData } from '../../../../shared/models/provider.models';


@Component({
  selector: 'app-ruta-detalle',
  templateUrl: './ruta-detalle.component.html',
  styleUrls: ['./ruta-detalle.component.css'],
  imports: [CommonModule, MapPoiComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class RutaDetalleComponent implements OnInit {
  selectedRoute: Route | null = null;
  providers: EnrichedProviderData[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  mapConfig: MapConfig = {
    center: [10.501005998543437, -84.6972559489806],
    zoom: 13,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private routeDataService: RouteDataService,
   
  ) {}

  ngOnInit(): void {
    
  }

  

  onProviderSelected(providerData: any): void {
    console.log('Provider selected in route detail:', providerData);
    // Aquí puedes implementar lógica específica para cuando se selecciona un proveedor
    // Por ejemplo, mostrar más detalles, permitir hacer reserva, etc.
  }

  onMapInitialized(): void {
    console.log('Map initialized in route detail');
  }

  goBack(): void {
    // Limpiar el servicio compartido
    this.routeDataService.clearSelectedRoute();

    this.router.navigate(['/turista/mapa-empresas'], {
      queryParams: {},
      queryParamsHandling: 'merge'
    });
  }

  // Métodos de utilidad para mostrar información de la ruta
  getDifficultyColor(): string {
    switch (this.selectedRoute?.difficulty) {
      case 'easy': return '#28a745'; // verde
      case 'medium': return '#ffc107'; // amarillo
      case 'hard': return '#dc3545'; // rojo
      default: return '#6c757d'; // gris
    }
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return 'No especificado';

    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) { // menos de 24 horas
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else { // días
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  }

  formatDistance(kilometers?: number): string {
    if (!kilometers) return 'No especificado';

    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m`;
    } else {
      return `${kilometers.toFixed(1)}km`;
    }
  }

  generateStarRating(rating?: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('full');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }

    return stars;
  }
}
