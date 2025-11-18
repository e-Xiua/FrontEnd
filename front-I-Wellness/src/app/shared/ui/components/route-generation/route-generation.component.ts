import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { Route, RouteDisplayOptions, RouteSelectionEvent } from '../../../models/route';
import { usuarios } from '../../../models/usuarios';
import { RouteGenerationStateService } from '../../../services/route-generation-state.service';
import { ShowRoutesManyOptionsComponent } from '../show-routes-many-options/show-routes-many-options.component';

@Component({
  selector: 'app-route-generation',
  standalone: true,
  imports: [CommonModule, ShowRoutesManyOptionsComponent],
  templateUrl: './route-generation.component.html',
  styleUrls: ['./route-generation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteGenerationComponent implements OnInit, OnChanges {
  @Input() title = 'Rutas generadas';
  @Input() description = 'Explora las rutas optimizadas disponibles.';
  @Input() showHeader = false;
  @Input() userId?: string | number;
  @Input() maxRoutesToShow = 0;

  @Output() routeSelected = new EventEmitter<RouteSelectionEvent>();
  @Output() providerSelected = new EventEmitter<{ route: Route; provider: usuarios }>();
  @Output() emptyRoutes = new EventEmitter<void>();

  get routes$() {
    return this.state.routes$;
  }

  get isLoading$() {
    return this.state.isLoading$;
  }

  get error$() {
    return this.state.error$;
  }

  displayOptions: RouteDisplayOptions = {
    showRouteInfo: true,
    showProviderCarousel: true,
    showProviderCard: true,
    showRouteLines: true,
    compactMode: false,
    allowRouteSelection: true
  };

  constructor(private readonly state: RouteGenerationStateService) {}

  ngOnInit(): void {
    this.loadRoutes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && !changes['userId'].isFirstChange()) {
      this.loadRoutes();
    }
  }

  onRouteSelected(event: RouteSelectionEvent): void {
    this.state.handleRouteSelected(event);
    this.routeSelected.emit(event);
  }

  onProviderSelected(event: { route: Route; provider: usuarios }): void {
    this.state.handleProviderSelected(event.route, event.provider);
    this.providerSelected.emit(event);
  }

  onRetry(): void {
    this.state.refreshRoutes();
  }

  private loadRoutes(): void {
    this.state.loadCompletedRoutes(this.userId);
  }
}
