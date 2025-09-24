import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Route, RouteSelectionEvent } from '../../../../shared/models/route';
import { usuarios } from '../../../../shared/models/usuarios';
import { RouteDataService } from '../../../../shared/services/route-data.service';
import { MapConfig } from '../../../../shared/ui/components/map-poi/map-poi.component';
import { RoutePoisShowComponent } from "../../../../shared/ui/components/route-pois-show/route-pois-show.component";
import { RouteFilter, ShowRoutesManyOptionsComponent } from "../../../../shared/ui/components/show-routes-many-options/show-routes-many-options.component";
import { createMockRoutes } from '../../../../shared/util/mock-many-routes';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-mapa-empresas',
  templateUrl: './mapa-empresas.component.html',
  styleUrls: ['./mapa-empresas.component.css'],
  imports: [CommonModule, RoutePoisShowComponent, ShowRoutesManyOptionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class MapaEmpresasComponent implements OnInit {

  providers: usuarios[] = [];
  routes: Route[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  selectedRoute: Route | null = null;

  mapConfig: MapConfig = {
    center: [10.501005998543437, -84.6972559489806],
    zoom: 13,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  constructor(
    private usuarioServicio: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private routeDataService: RouteDataService
  ) {}

  ngOnInit(): void {
    this.loadProviders();
  }

  private loadProviders(): void {
    this.isLoading = true;
    this.error = null;

    this.usuarioServicio.obtenerProveedores().subscribe({
      next: (proveedores) => {
        console.log('Proveedores obtenidos:', proveedores);
        this.providers = proveedores;

        // Crear múltiples rutas con diferentes configuraciones para testing
        this.routes = createMockRoutes(proveedores);

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al obtener proveedores', err);
        this.error = 'Error al cargar los proveedores';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onProviderSelected(providerData: any): void {
    console.log('Provider selected in mapa-empresas:', providerData);
    // Aquí puedes agregar lógica adicional específica para mapa-empresas
    // como navegación, analytics, etc.
  }

  onMapInitialized(): void {
    console.log('Map initialized in mapa-empresas');
    // Lógica adicional después de que el mapa se inicialice
  }

  retryLoad(): void {
    this.loadProviders();
  }

  onRouteProviderSelected(route: Route, provider: usuarios): void {
    console.log('Provider selected from route:', { route: route.name, provider: provider.nombre });

    // Aquí puedes implementar lógica específica cuando se selecciona un proveedor desde una ruta
    // Por ejemplo, mostrar detalles del proveedor, navegar a su página, etc.

    // Ejemplo: navegar a los detalles del proveedor
    // this.router.navigate(['/proveedor', provider.id]);
  }

  onRouteFiltersChanged(filters: RouteFilter): void {
    console.log('Route filters changed:', filters);
    // Aquí puedes guardar los filtros en el estado de la aplicación
    // o realizar acciones adicionales cuando los filtros cambian
  }

  onRouteSelected($event: RouteSelectionEvent) {
    this.selectedRoute = $event.route;
    console.log('Route selected:', this.selectedRoute);
  }

  navigateToRouteDetail(): void {
    if (this.selectedRoute) {
      console.log('Navigating to route detail:', this.selectedRoute.name);
      console.log('Selected route object:', this.selectedRoute);

      // Método 1: Guardar en el servicio compartido (respaldo confiable)
      this.routeDataService.setSelectedRoute(this.selectedRoute);

      // Método 2: Convertir la ruta a JSON para pasarla como parámetro de consulta
      try {
        const routeJson = JSON.stringify(this.selectedRoute);
        const routeData = encodeURIComponent(routeJson);

        console.log('Route JSON length:', routeJson.length);
        console.log('Encoded route data length:', routeData.length);

        // Navegar a la página de detalle de la ruta pasando los datos como query param
        this.router.navigate(['/ruta-detalle'], {
          queryParams: {
            routeData: routeData
          }
        });
      } catch (error) {
        console.error('Error encoding route data, using service fallback:', error);
        // Si hay error con los query params, navegar solo con el servicio
        this.router.navigate(['/ruta-detalle']);
      }
    } else {
      console.warn('No route selected for navigation');
    }
  }

}
