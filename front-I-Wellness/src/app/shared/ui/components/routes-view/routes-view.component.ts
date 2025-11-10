import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Route, RouteDisplayOptions, RouteSelectionEvent } from '../../../models/route';
import { usuarios } from '../../../models/usuarios';
import { RouteFilter, RouteFilteringService } from '../../../services/route-filtering.service';
import { ShowRoutesManyOptionsComponent } from '../show-routes-many-options/show-routes-many-options.component';

@Component({
  selector: 'app-routes-view',
  standalone: true,
  imports: [CommonModule, ShowRoutesManyOptionsComponent],
  templateUrl: './routes-view.component.html',
  styleUrls: ['./routes-view.component.css'],
  providers: [RouteFilteringService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutesViewComponent implements OnInit {
  @Input() set routes(value: Route[]) {
    this.routeFilteringService.setRoutes(value);
  }
  @Input() displayOptions: RouteDisplayOptions = {
    showRouteInfo: true,
    showProviderCarousel: true,
    showProviderCard: true,
    showRouteLines: true,
    compactMode: false,
    allowRouteSelection: true
  };
  @Input() maxRoutesToShow: number = 5;
  @Input() layoutMode: 'grid' | 'list' | 'accordion' = 'accordion';
  @Input() showRouteStats: boolean = true;

  @Output() routeSelected = new EventEmitter<RouteSelectionEvent>();
  @Output() providerSelected = new EventEmitter<{ route: Route; provider: usuarios }>();
  @Output() filtersChanged = new EventEmitter<RouteFilter>();

  filteredRoutes$: Observable<Route[]>;
  currentFilters$: Observable<RouteFilter>;

  categories: string[] = [];
  difficulties: string[] = ['easy', 'medium', 'hard'];

  constructor(private routeFilteringService: RouteFilteringService) {
    this.filteredRoutes$ = this.routeFilteringService.filteredRoutes$;
    this.currentFilters$ = this.routeFilteringService.filters$;
  }

  ngOnInit(): void {
    this.routeFilteringService.routes$.subscribe((routes: Route[]) => {
      this.extractCategories(routes);
    });

    this.currentFilters$.subscribe(filters => {
      this.filtersChanged.emit(filters);
    });
  }

  private extractCategories(routes: Route[]): void {
    const categorySet = new Set<string>();
    routes.forEach(route => {
      if (route.category) {
        categorySet.add(route.category);
      }
    });
    this.categories = Array.from(categorySet);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.routeFilteringService.updateFilters({ searchText: target.value });
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.routeFilteringService.updateFilters({ category: target.value || undefined });
  }

  onDifficultyChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.routeFilteringService.updateFilters({ difficulty: target.value as any || undefined });
  }

  clearFilters(): void {
    this.routeFilteringService.clearFilters();
  }

  hasFilters(filters: RouteFilter | null): boolean {
    if (!filters) return false;
    return Object.keys(filters).length > 0 && Object.values(filters).some(v => v !== undefined && v !== '');
  }

  // Passthrough events from dumb component
  onRouteSelectedInChild(event: RouteSelectionEvent): void {
    this.routeSelected.emit(event);
  }

  onProviderSelectedInChild(event: { route: Route; provider: usuarios }): void {
    this.providerSelected.emit(event);
  }
}
