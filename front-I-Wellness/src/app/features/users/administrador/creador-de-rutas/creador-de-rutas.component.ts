import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { OptimizationResultAdapterService } from '../../../../shared/models/adapters/optimization-result-adapter.service'; // 2. Import the new adapter
import { Route, RouteSelectionEvent } from '../../../../shared/models/route'; // 1. Import the Route model
import { usuarios } from '../../../../shared/models/usuarios';
import { RouteOptimizationService } from '../../../../shared/services/route-optimization.service';
import { RouteFilter, ShowRoutesManyOptionsComponent } from "../../../../shared/ui/components/show-routes-many-options/show-routes-many-options.component";

@Component({
  selector: 'app-creador-de-rutas',
  standalone: true, // Make it standalone
  imports: [CommonModule, ShowRoutesManyOptionsComponent], // Add CommonModule for *ngIf
  templateUrl: './creador-de-rutas.component.html',
  styleUrl: './creador-de-rutas.component.css'
})
export class CreadorDeRutasComponent implements OnInit {

  // This property will now hold the adapted data in the correct format
  adaptedRoutes: Route[] = [];
  isLoading = true;
  error: string | null = null;

  // 3. Inject the new adapter service
  constructor(
    private routeOptimizationService: RouteOptimizationService,
    private resultAdapter: OptimizationResultAdapterService
  ) {}

  ngOnInit(): void {
    this.fetchAndAdaptOptimizedRoutes();
  }

  private fetchAndAdaptOptimizedRoutes(): void {

    this.isLoading = true;
    this.error = null;
    console.log('Fetching optimized routes...');

    this.routeOptimizationService.getAllRoutes().subscribe({
      next: (allOptimizationResults) => {
        console.log('Rutas optimizadas obtenidas del servicio:', allOptimizationResults);
        const resultsArray = allOptimizationResults ? (Array.isArray(allOptimizationResults) ? allOptimizationResults : [allOptimizationResults]) : [];

        // 4. Use the adapter to transform the data
        this.adaptedRoutes = this.resultAdapter.adaptAll(resultsArray);

        console.log('Rutas adaptadas para el componente UI:', this.adaptedRoutes);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener rutas optimizadas', err);
        this.error = 'No se pudieron cargar las rutas optimizadas.';
        this.isLoading = false;
      }
    });
  }

    onRouteFiltersChanged($event: RouteFilter) {
  console.log('Route filters changed:', $event);
  }
  onRouteProviderSelected(arg0: Route,arg1: usuarios) {
  console.log('Route provider selected:', arg0, arg1);
  }
  onRouteSelected($event: RouteSelectionEvent) {
  console.log('Route selected:', $event);
  }
}
