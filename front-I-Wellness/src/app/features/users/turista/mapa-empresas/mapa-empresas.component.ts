import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OptimizedPoiAdapterService } from '../../../../shared/models/adapters/optimized-poi-adapter';
import { Route, RouteSelectionEvent } from '../../../../shared/models/route';
import { usuarios } from '../../../../shared/models/usuarios';
import { RouteDataService } from '../../../../shared/services/route-data.service';
import { OptimizationResult, RouteOptimizationRequest, RouteOptimizationService } from '../../../../shared/services/route-optimization.service';
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

  // Expose Math for template
  Math = Math;

  // Route optimization properties - Support multiple simultaneous optimizations
  activeOptimizations: Map<string, {
    routeId: string;
    routeName: string;
    isOptimizing: boolean;
    progress: number;
    message: string;
    result: OptimizationResult | null;
    jobId?: string;
  }> = new Map();

  // Legacy single optimization properties for backward compatibility
  isOptimizing: boolean = false;
  optimizationProgress: number = 0;
  optimizationMessage: string = '';
  optimizedResult: OptimizationResult | null = null;
  optimizedResults: OptimizationResult[] = [];
  providerResults: usuarios[] = []; // Created to store providers from optimization results

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
    private routeDataService: RouteDataService,
    private routeOptimizationService: RouteOptimizationService,
    public poiAdapter: OptimizedPoiAdapterService
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

    this.routeOptimizationService.getAllRoutes().subscribe({
      next: (allRoutes) => {
        console.log('Rutas optimizadas obtenidas del servicio:', allRoutes);
        this.optimizedResults = allRoutes ? (Array.isArray(allRoutes) ? allRoutes : [allRoutes]) : [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al obtener rutas optimizadas', err);
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

  /**
   * Optimize selected route using MRL-AMIS model (supports multiple simultaneous optimizations)
   */
  optimizeSelectedRoute(): void {
    if (!this.selectedRoute) {
      console.warn('No route selected for optimization');
      return;
    }

    const routeKey = `${this.selectedRoute.id}-${Date.now()}`;
    console.log('Starting route optimization for:', this.selectedRoute.name, 'with key:', routeKey);

    // Create optimization entry for this route
    const optimizationEntry = {
      routeId: this.selectedRoute.id,
      routeName: this.selectedRoute.name,
      isOptimizing: true,
      progress: 0,
      message: 'Iniciando optimización de ruta...',
      result: null,
      jobId: undefined
    };

    this.activeOptimizations.set(routeKey, optimizationEntry);

    // Update legacy properties for backward compatibility
    this.isOptimizing = true;
    this.optimizationProgress = 0;
    this.optimizationMessage = 'Iniciando optimización de ruta...';
    this.optimizedResult = null;
    this.cdr.markForCheck();

    // Convert selected route to optimization request format
    const optimizationRequest: RouteOptimizationRequest = this.buildOptimizationRequest(this.selectedRoute);

    console.log('=== FRONTEND SENDING OPTIMIZATION REQUEST ===');
    console.log('Request payload:', JSON.stringify(optimizationRequest, null, 2));
    console.log('===========================================');

    // Start the optimization process with Request-Response with Status Polling pattern
    this.routeOptimizationService.optimizeRouteComplete(optimizationRequest).subscribe({
      next: (result: OptimizationResult) => {
        console.log('Route optimization completed for key:', routeKey, result);

        // Update specific optimization entry
        const entry = this.activeOptimizations.get(routeKey);
        if (entry) {
          entry.result = result;
          entry.message = 'Optimización completada exitosamente';
          entry.progress = 100;
          entry.isOptimizing = false;
          this.activeOptimizations.set(routeKey, entry);
        }

        // Update legacy properties (for the most recent optimization)
        this.optimizedResult = result;
        this.optimizationMessage = 'Optimización completada exitosamente';
        this.optimizationProgress = 100;
        this.updateLegacyOptimizingStatus();
        this.cdr.markForCheck();

        // Update the selected route with optimized data
        this.updateRouteWithOptimizedData(result);
        this.handleOptimizationComplete(routeKey, result);
      },
      error: (error) => {
        console.error('Route optimization failed for key:', routeKey, error);

        // Update specific optimization entry
        const entry = this.activeOptimizations.get(routeKey);
        if (entry) {
          entry.message = `Error en la optimización: ${error.message || 'Error desconocido'}`;
          entry.isOptimizing = false;
          entry.progress = 0;
          this.activeOptimizations.set(routeKey, entry);
        }

        // Update legacy properties if this was the most recent optimization
        this.optimizationMessage = `Error en la optimización: ${error.message || 'Error desconocido'}`;
        this.updateLegacyOptimizingStatus();
        this.optimizationProgress = 0;
        this.cdr.markForCheck();

        this.resetOptimizationState(routeKey);
        this.showError(this.optimizationMessage);
      }
    });

    // Monitor optimization progress for this specific route
    this.monitorOptimizationProgress(routeKey);
  }

  /**
   * Build optimization request from selected route
   */
  private buildOptimizationRequest(route: Route): RouteOptimizationRequest {
    return {
      routeId: `route-${route.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      userId: 'tourist-user', // This should come from auth service
      pois: route.providers.map((provider, index) => ({
        id: provider.id || index + 1,
        name: this.getProviderName(provider),
        latitude: 10.501 + (Math.random() * 0.05), // Mock coordinates for Costa Rica
        longitude: -84.697 + (Math.random() * 0.05),
        category: this.getProviderCategory(provider),
        subcategory: 'service',
        visitDuration: 90, // Default 1.5 hours for business visits
        cost: this.estimateProviderCost(provider),
        rating: 4.0 + (Math.random() * 1.0), // Random rating between 4-5
        description: `Visita a ${this.getProviderName(provider)}`,
        accessibility: true, // Assume accessible by default
        providerId: provider.id,
        providerName: this.getProviderName(provider)
      })),
      preferences: {
        optimizeFor: 'distance', // Could be made configurable
        maxTotalTime: 8 * 60, // 8 hours
        maxTotalCost: 200, // USD
        accessibilityRequired: false
      },
      constraints: {
        startTime: '08:00',
        lunchBreakRequired: true,
        lunchBreakDuration: 60
      }
    };
  }

  /**
   * Update legacy isOptimizing status based on active optimizations
   */
  private updateLegacyOptimizingStatus(): void {
    this.isOptimizing = Array.from(this.activeOptimizations.values()).some(entry => entry.isOptimizing);
  }

  /**
   * Monitor optimization progress with polling updates for a specific route
   */
  private monitorOptimizationProgress(routeKey: string): void {
    const progressMessages = [
      'Analizando POIs de la ruta...',
      'Calculando distancias entre puntos...',
      'Ejecutando algoritmo MRL-AMIS...',
      'Optimizando secuencia de visitas...',
      'Generando ruta final...'
    ];

    let messageIndex = 0;
    const progressInterval = setInterval(() => {
      const entry = this.activeOptimizations.get(routeKey);
      if (!entry || !entry.isOptimizing) {
        clearInterval(progressInterval);
        return;
      }

      // Update progress for this specific optimization
      entry.progress = Math.min(entry.progress + 15, 95);

      if (messageIndex < progressMessages.length) {
        entry.message = progressMessages[messageIndex];
        messageIndex++;
      }

      this.activeOptimizations.set(routeKey, entry);

      // Update legacy properties if this is the most recent optimization
      this.optimizationProgress = entry.progress;
      this.optimizationMessage = entry.message;

      this.cdr.markForCheck();
    }, 3000); // Update every 3 seconds
  }

  /**
   * Update selected route with optimized data
   */
  private updateRouteWithOptimizedData(result: OptimizationResult): void {
    if (!this.selectedRoute || !result.optimizedSequence) {
      return;
    }

    // Create optimized providers based on the optimized sequence
    const optimizedProviders = result.optimizedSequence.map(optimizedPoi => {
      // Find the original provider
      const originalProvider = this.selectedRoute!.providers.find(provider =>
        provider.id === optimizedPoi.poiId
      );

      return {
        ...originalProvider!,
        visitOrder: optimizedPoi.visitOrder,
        estimatedArrivalTime: optimizedPoi.arrivalTime,
        estimatedDepartureTime: optimizedPoi.departureTime,
        visitDuration: optimizedPoi.estimatedVisitTime
      };
    }).sort((a, b) => (a.visitOrder || 0) - (b.visitOrder || 0)); // Sort by visit order

    // Create a new optimized route based on the result
    const optimizedRoute: Route = {
      ...this.selectedRoute,
      id: `${this.selectedRoute.id}-optimized-${Date.now()}`,
      name: `${this.selectedRoute.name} (Optimizada)`,
      description: `${this.selectedRoute.description || ''}\n\nRuta optimizada con MRL-AMIS:\n- Distancia total: ${result.totalDistanceKm.toFixed(1)} km\n- Tiempo estimado: ${Math.floor(result.totalTimeMinutes / 60)}h ${result.totalTimeMinutes % 60}m\n- Puntuación de optimización: ${(result.optimizationScore * 100).toFixed(1)}%`,
      estimatedTime: result.totalTimeMinutes,
      estimatedDistance: result.totalDistanceKm,
      providers: optimizedProviders,
      tags: [...(this.selectedRoute.tags || []), 'optimized', 'mrl-amis'],
      rating: this.selectedRoute.rating ? this.selectedRoute.rating + 0.5 : 4.5 // Boost rating for optimized routes
    };

    // Add the optimized route to the routes list
    this.routes.unshift(optimizedRoute);

    // Select the optimized route
    this.selectedRoute = optimizedRoute;

    console.log('Route updated with optimization data:', optimizedRoute);
    this.cdr.markForCheck();
  }

  /**
   * Test route optimization with random route
   */
  testRouteOptimization(): void {
    console.log('Testing route optimization with random route...');

    // Select a random route for testing
    if (this.routes.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.routes.length);
      this.selectedRoute = this.routes[randomIndex];
      console.log('Selected random route for testing:', this.selectedRoute.name);

      // Start optimization
      this.optimizeSelectedRoute();
    } else {
      console.warn('No routes available for testing');
    }
  }

  /**
   * Handle optimization completion for a specific route
   */
  private handleOptimizationComplete(routeKey: string, optimizedData: OptimizationResult): void {
    console.log(`Optimization completed for route ${routeKey}:`, optimizedData);

    const entry = this.activeOptimizations.get(routeKey);
    if (entry) {
      entry.result = optimizedData;
      entry.message = 'Optimización completada exitosamente';
      entry.progress = 100;
      entry.isOptimizing = false;
      this.activeOptimizations.set(routeKey, entry);
    }

    // Update legacy properties (for the most recent optimization)
    this.optimizedResult = optimizedData;
    this.optimizationMessage = 'Optimización completada exitosamente';
    this.optimizationProgress = 100;
    this.updateLegacyOptimizingStatus();
    this.cdr.markForCheck();

    // Update the selected route with optimized data
    this.updateRouteWithOptimizedData(optimizedData);
  }

  /**
   * Reset optimization state for a specific route
   */
  private resetOptimizationState(routeKey?: string): void {
    if (routeKey) {
      // Reset specific optimization
      this.activeOptimizations.delete(routeKey);
      this.updateLegacyOptimizingStatus();
    } else {
      // Reset all optimizations (legacy behavior)
      this.activeOptimizations.clear();
      this.isOptimizing = false;
    }

    // Update legacy state
    this.optimizationProgress = 0;
    this.optimizationMessage = '';
    this.cdr.markForCheck();
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    console.error('Error:', message);
    // You can implement toast notifications or other error display methods here
    // For now, just log the error
  }

  /**
   * Clear optimization results
   */
  clearOptimizationResults(): void {
    this.optimizedResult = null;
    this.optimizationProgress = 0;
    this.optimizationMessage = '';
    this.isOptimizing = false;
    this.activeOptimizations.clear();
    this.cdr.markForCheck();
  }

  /**
   * Utility methods for provider data extraction
   */
  private getProviderName(provider: usuarios): string {
    return provider.proveedorInfo?.nombreEmpresa || provider.nombre || `Provider ${provider.id}`;
  }

  private getProviderCategory(provider: usuarios): string {
    return provider.proveedorInfo?.categoriaEmpresa || 'tourism';
  }

  private estimateProviderCost(provider: usuarios): number {
    // Mock cost estimation based on provider ID
    const baseCost = 15 + (provider.id % 10) * 5; // $15-60 range
    return baseCost + Math.floor(Math.random() * 20); // Add some randomness
  }

  /**
   * TrackBy function for *ngFor to improve performance when rendering optimization entries
   */
  trackOptimizationEntry(index: number, entry: any): string {
    return entry.key;
  }

  /**
   * Cancel a specific optimization process
   */
  cancelOptimization(routeKey: string): void {
    console.log('Cancelling optimization for route:', routeKey);

    const entry = this.activeOptimizations.get(routeKey);
    if (entry && entry.isOptimizing) {
      // Update the optimization entry to mark as cancelled
      entry.isOptimizing = false;
      entry.message = 'Optimización cancelada por el usuario';
      entry.progress = 0;
      this.activeOptimizations.set(routeKey, entry);

      // Update legacy status
      this.updateLegacyOptimizingStatus();

      // If there's a job ID, we could potentially cancel it on the backend
      if (entry.jobId) {
        // TODO: Implement backend cancellation if needed
        console.log('Would cancel backend job:', entry.jobId);
      }

      this.cdr.markForCheck();
    }
  }

  /**
   * Remove a specific optimization entry from the active optimizations
   */
  removeOptimization(routeKey: string): void {
    console.log('Removing optimization entry for route:', routeKey);

    const entry = this.activeOptimizations.get(routeKey);
    if (entry) {
      // If the optimization is still running, cancel it first
      if (entry.isOptimizing) {
        this.cancelOptimization(routeKey);
      }

      // Remove the entry from the map
      this.activeOptimizations.delete(routeKey);

      // Update legacy status
      this.updateLegacyOptimizingStatus();

      this.cdr.markForCheck();
    }
  }

  /**
   * Clear all optimization entries
   */
  clearAllOptimizations(): void {
    console.log('Clearing all optimization entries');

    // Cancel any running optimizations first
    for (const [routeKey, entry] of this.activeOptimizations.entries()) {
      if (entry.isOptimizing) {
        entry.isOptimizing = false;
        entry.message = 'Optimización cancelada (limpieza masiva)';
        if (entry.jobId) {
          console.log('Would cancel backend job:', entry.jobId);
        }
      }
    }

    // Clear all optimizations
    this.activeOptimizations.clear();

    // Reset legacy properties
    this.isOptimizing = false;
    this.optimizationProgress = 0;
    this.optimizationMessage = '';
    this.optimizedResult = null;

    this.cdr.markForCheck();
  }

}
