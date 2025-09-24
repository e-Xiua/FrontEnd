import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Route } from '../../../../shared/models/route';
import { usuarios } from '../../../../shared/models/usuarios';
import { RouteDataService } from '../../../../shared/services/route-data.service';
import { MapConfig, MapPoiComponent } from '../../../../shared/ui/components/map-poi/map-poi.component';

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
  providers: usuarios[] = [];
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
    private routeDataService: RouteDataService
  ) {}

  ngOnInit(): void {
    this.loadRouteData();
  }

  private loadRouteData(): void {
    this.isLoading = true;
    this.error = null;
    console.log('Cargando datos de la ruta...');

    // Método 1: Intentar obtener desde query params
    this.route.queryParams.subscribe(params => {
      console.log('Query params recibidos:', params);
      let routeData: Route | null = null;

      try {
        if (params['routeData']) {
          console.log('Raw routeData param:', params['routeData']);
          const decodedData = decodeURIComponent(params['routeData']);
          console.log('Decoded data length:', decodedData.length);
          routeData = JSON.parse(decodedData) as Route;
          console.log('Datos de la ruta obtenidos desde queryParams:', routeData);
        } else {
          console.log('No routeData found in query params');
        }
      } catch (error) {
        console.error('Error parsing route data from query params:', error);
      }

      // Método 2: Intentar obtener desde el servicio compartido (fallback principal)
      if (!routeData) {
        routeData = this.routeDataService.getSelectedRoute();
        console.log('Datos de la ruta obtenidos desde servicio:', routeData);
      }

      // Método 3: Intentar obtener desde el estado de navegación (último recurso)
      if (!routeData) {
        const navigation = this.router.getCurrentNavigation();
        routeData = navigation?.extras?.state?.['route'] as Route;
        console.log('Datos de navegación (último recurso):', navigation);
        console.log('Datos de la ruta extraídos (último recurso):', routeData);
      }

      if (routeData) {
        console.log('Procesando datos de la ruta:', routeData.name);
        this.processRouteData(routeData);
      } else {
        // Si no hay datos de ninguna fuente, mostrar error
        this.error = 'No se encontraron datos de la ruta';
        console.error(this.error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private processRouteData(routeData: Route): void {
    this.selectedRoute = routeData;
    this.providers = routeData.providers || [];

    // Configurar el centro del mapa basado en los proveedores o ubicación de inicio de la ruta
    if (this.selectedRoute.startLocation) {
      this.mapConfig.center = this.selectedRoute.startLocation;
    } else if (this.providers.length > 0) {
      // Usar la ubicación del primer proveedor como centro
      const firstProvider = this.providers[0];
      if (firstProvider.proveedorInfo?.latitud && firstProvider.proveedorInfo?.longitud) {
        this.mapConfig.center = [firstProvider.proveedorInfo.latitud, firstProvider.proveedorInfo.longitud];
      }
    }

    this.isLoading = false;
    this.cdr.markForCheck();
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

    this.router.navigate(['/mapaempresas'], {
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
