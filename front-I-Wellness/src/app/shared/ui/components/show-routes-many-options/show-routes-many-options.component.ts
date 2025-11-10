import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { Subscription } from 'rxjs';
import { Route, RouteDisplayOptions, RouteSelectionEvent } from '../../../models/route';
import { usuarios } from '../../../models/usuarios';
import { RouteFilter, RouteFilteringService } from '../../../services/route-filtering.service';
import { RouteMapDisplayComponent } from '../route-generation/route-map-display/route-map-display.component';

@Component({
  selector: 'app-show-routes-many-options',
  standalone: true,
  imports: [CommonModule, RouteMapDisplayComponent],
  templateUrl: './show-routes-many-options.component.html',
  styleUrl: './show-routes-many-options.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowRoutesManyOptionsComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  @ViewChildren(RouteMapDisplayComponent) mapComponents!: QueryList<RouteMapDisplayComponent>;

  @Input() routes: Route[] = [];
  @Input() displayOptions: RouteDisplayOptions = {
    showRouteInfo: true,
    showProviderCarousel: true,
    showProviderCard: true,
    showRouteLines: true,
    compactMode: false,
    allowRouteSelection: true
  };
  @Input() maxRoutesToShow: number = 0; // Default to 0 to show all, let parent decide
  @Input() showFilters: boolean = false; // Default to false
  @Input() showRouteStats: boolean = true;
  @Input() layoutMode: 'grid' | 'list' | 'accordion' = 'accordion';

  @Output() routeSelected = new EventEmitter<RouteSelectionEvent>();
  @Output() providerSelected = new EventEmitter<{ route: Route; provider: usuarios }>();

  // Internal state
  displayRoutes: Route[] = [];
  private allFilteredRoutes: Route[] = [];
  expandedRoutes: Set<string> = new Set();
  activeRouteId: string | null = null;

  // Statistics
  totalProviders: number = 0;
  averageRating: number = 0;
  availableCategories: string[] = [];
  availableTags: string[] = [];
  currentFilters: RouteFilter = {};
  filtersEmpty: boolean = true;
  private selectedTags = new Set<string>();
  private readonly subscriptions = new Subscription();

  // Map config
  mapConfig = {
    center: [10.501005998543437, -84.6972559489806] as [number, number],
    zoom: 13,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  // Loading state
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
  private readonly cdr: ChangeDetectorRef,
  private readonly routeFilteringService: RouteFilteringService
  ) {}

  ngOnInit(): void {
    this.subscribeToFilteringStreams();
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['routes']) {
      this.routeFilteringService.setRoutes(this.routes ?? []);
      this.updateAvailableFilters(this.routes ?? []);
      this.resetExpandedRoutesIfNeeded();
    }

    if (changes['maxRoutesToShow'] && !changes['maxRoutesToShow'].firstChange) {
      this.applyMaxRoutesLimit();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeComponent(): void {
    this.routeFilteringService.setRoutes(this.routes ?? []);
    this.updateAvailableFilters(this.routes ?? []);
    this.resetExpandedRoutesIfNeeded();
    this.cdr.markForCheck();
  }

  private subscribeToFilteringStreams(): void {
    this.subscriptions.add(
      this.routeFilteringService.filteredRoutes$.subscribe(routes => {
        this.allFilteredRoutes = routes;
        this.applyMaxRoutesLimit();
      })
    );

    this.subscriptions.add(
      this.routeFilteringService.filters$.subscribe(filters => {
        this.currentFilters = filters;
        this.selectedTags = new Set(filters.tags ?? []);
        this.filtersEmpty = this.computeFiltersEmpty(filters);
        this.cdr.markForCheck();
      })
    );
  }

  private applyMaxRoutesLimit(): void {
    const limitedRoutes = this.maxRoutesToShow > 0
      ? this.allFilteredRoutes.slice(0, this.maxRoutesToShow)
      : [...this.allFilteredRoutes];

    this.displayRoutes = limitedRoutes;
    this.calculateStats();
    this.resetExpandedRoutesIfNeeded();
    this.cdr.markForCheck();
  }

  private calculateStats(): void {
    this.totalProviders = this.displayRoutes.reduce((total, route) => total + route.providers.length, 0);

    const ratings = this.displayRoutes.map(r => r.rating || 0).filter(r => r > 0);
    this.averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  }

  private updateAvailableFilters(routes: Route[]): void {
    const categorySet = new Set<string>();
    const tagsSet = new Set<string>();

    for (const route of routes) {
      if (route.category) {
        categorySet.add(route.category);
      }
      for (const tag of route.tags ?? []) {
        if (tag) {
          tagsSet.add(tag);
        }
      }
      for (const providerCategory of route.providerCategories ?? []) {
        if (providerCategory) {
          tagsSet.add(providerCategory);
        }
      }
    }

    this.availableCategories = Array.from(categorySet.values()).sort((a, b) => a.localeCompare(b));
    this.availableTags = Array.from(tagsSet.values()).sort((a, b) => a.localeCompare(b));
  }

  private resetExpandedRoutesIfNeeded(): void {
    if (this.layoutMode === 'accordion') {
      if (this.displayRoutes.length === 0) {
        this.expandedRoutes.clear();
        return;
      }

      const firstRouteId = this.displayRoutes[0]?.id;
      if (firstRouteId && !this.expandedRoutes.has(firstRouteId)) {
        this.expandedRoutes.clear();
        this.expandedRoutes.add(firstRouteId);
      }
    }
  }

  private computeFiltersEmpty(filters: RouteFilter): boolean {
    const hasCategory = !!filters.category;
    const hasMin = filters.minDuration !== undefined && filters.minDuration !== null;
    const hasMax = filters.maxDuration !== undefined && filters.maxDuration !== null;
    const hasTags = !!filters.tags && filters.tags.length > 0;
    const hasSearch = !!filters.searchText && filters.searchText.trim().length > 0;
    return !(hasCategory || hasMin || hasMax || hasTags || hasSearch);
  }

  // Route interaction methods
  toggleRouteExpansion(routeId: string): void {
    if (this.expandedRoutes.has(routeId)) {
      this.expandedRoutes.delete(routeId);
      this.emitRouteEvent('route_collapsed', this.getRouteById(routeId));
    } else {
      if (this.layoutMode === 'accordion') {
        this.expandedRoutes.clear();
      }
      this.expandedRoutes.add(routeId);
      this.emitRouteEvent('route_expanded', this.getRouteById(routeId));
    }
    this.cdr.markForCheck();
  }

  selectRoute(route: Route): void {
    this.activeRouteId = route.id;
    this.emitRouteEvent('route_selected', route);
  }

  onRouteProviderSelected(route: Route, providerId: number | string): void {
    const provider = route.providers.find(p => p.id === providerId);
    if (provider) {
      this.providerSelected.emit({ route, provider: provider });
      this.emitRouteEvent('provider_selected', route, provider);
    }
  }

  onRouteMapInitialized(route: Route): void {
    console.log(`Mapa inicializado para ruta: ${route.name}`);
  }

  // Filtering handlers
  onSearchChange(rawValue: string): void {
    const trimmed = rawValue.trim();
    this.routeFilteringService.updateFilters({ searchText: trimmed.length > 0 ? trimmed : undefined });
  }

  onCategoryChange(value: string): void {
    const category = value === '' ? undefined : value;
    this.routeFilteringService.updateFilters({ category });
  }

  onMinDurationChange(value: string): void {
    const numberValue = Number(value);
    this.routeFilteringService.updateFilters({ minDuration: Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined });
  }

  onMaxDurationChange(value: string): void {
    const numberValue = Number(value);
    this.routeFilteringService.updateFilters({ maxDuration: Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined });
  }

  onTagToggle(tag: string, checked: boolean): void {
    if (checked) {
      this.selectedTags.add(tag);
    } else {
      this.selectedTags.delete(tag);
    }
    const tags = this.selectedTags.size > 0 ? Array.from(this.selectedTags.values()) : undefined;
    this.routeFilteringService.updateFilters({ tags });
  }

  clearFilters(): void {
    this.selectedTags.clear();
    this.routeFilteringService.clearFilters();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.has(tag);
  }

  // Utility methods
  private getRouteById(routeId: string): Route | undefined {
    return this.routes.find(route => route.id === routeId);
  }

  private emitRouteEvent(action: RouteSelectionEvent['action'], route?: Route, provider?: usuarios): void {
    if (route) {
      this.routeSelected.emit({
        route,
        selectedProvider: provider,
        action
      });
    }
  }

  isRouteExpanded(routeId: string): boolean {
    return this.expandedRoutes.has(routeId);
  }

  isRouteActive(routeId: string): boolean {
    return this.activeRouteId === routeId;
  }

  getRouteMapId(route: Route): string {
    return `route-map-${route.id}`;
  }

  trackByRouteId(index: number, route: Route): string {
    return route.id;
  }

  // Template methods
  onRouteHeaderKeyPress(event: KeyboardEvent, routeId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.layoutMode === 'accordion') {
        this.toggleRouteExpansion(routeId);
      } else {
        const route = this.getRouteById(routeId);
        if (route) {
          this.selectRoute(route);
        }
      }
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

  ngAfterViewInit(): void {
    // When map components change (e.g., expanding a new accordion),
    // we need to find the new one and refresh it.
    this.subscriptions.add(
      this.mapComponents.changes.subscribe((comps: QueryList<RouteMapDisplayComponent>) => {
        // Small delay to ensure the accordion container is visible
        setTimeout(() => {
          for (const mapComp of comps) {
            if (mapComp && typeof mapComp.invalidateMapSize === 'function') {
              mapComp.invalidateMapSize();
            }
          }
        }, 10);
      })
    );
  }
}
