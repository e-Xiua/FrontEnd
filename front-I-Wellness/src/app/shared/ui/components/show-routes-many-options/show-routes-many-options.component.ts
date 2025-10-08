import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { Route, RouteDisplayOptions, RouteSelectionEvent } from '../../../models/route';
import { usuarios } from '../../../models/usuarios';
import { RoutePoisShowComponent } from "../route-pois-show/route-pois-show.component";

export interface RouteFilter {
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  minDuration?: number;
  maxDuration?: number;
  tags?: string[];
  searchText?: string;
}

@Component({
  selector: 'app-show-routes-many-options',
  standalone: true,
  imports: [CommonModule, RoutePoisShowComponent],
  templateUrl: './show-routes-many-options.component.html',
  styleUrl: './show-routes-many-options.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowRoutesManyOptionsComponent implements OnInit, OnChanges {

  @ViewChildren(RoutePoisShowComponent) mapComponents!: QueryList<RoutePoisShowComponent>;

  @Input() routes: Route[] = [];
  @Input() displayOptions: RouteDisplayOptions = {
    showRouteInfo: true,
    showProviderCarousel: true,
    showProviderCard: true,
    showRouteLines: true,
    compactMode: false,
    allowRouteSelection: true
  };
  @Input() maxRoutesToShow: number = 5;
  @Input() showFilters: boolean = true;
  @Input() showRouteStats: boolean = true;
  @Input() layoutMode: 'grid' | 'list' | 'accordion' = 'accordion';

  @Output() routeSelected = new EventEmitter<RouteSelectionEvent>();
  @Output() providerSelected = new EventEmitter<{ route: Route; provider: usuarios }>();
  @Output() filtersChanged = new EventEmitter<RouteFilter>();

  // Estado interno
  filteredRoutes: Route[] = [];
  expandedRoutes: Set<string> = new Set();
  activeRouteId: string | null = null;
  currentFilters: RouteFilter = {};

  // Estadísticas
  totalProviders: number = 0;
  averageRating: number = 0;
  categories: string[] = [];
  difficulties: string[] = ['easy', 'medium', 'hard'];

  // Configuración para route-pois-show
  mapConfig = {
    center: [10.501005998543437, -84.6972559489806] as [number, number],
    zoom: 13,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  // Estado de carga
  isLoading: boolean = false;
  error: string | null = null;  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnChanges(): void {
    this.applyFilters();
    this.calculateStats();
  }

  private initializeComponent(): void {
    this.filteredRoutes = [...this.routes];
    this.calculateStats();
    this.extractCategories();

    // Auto-expandir la primera ruta si está en modo accordion
    if (this.layoutMode === 'accordion' && this.routes.length > 0) {
      this.expandedRoutes.add(this.routes[0].id);
    }

    this.cdr.markForCheck();
  }

  private calculateStats(): void {
    this.totalProviders = this.filteredRoutes.reduce((total, route) => total + route.providers.length, 0);

    const ratingsSum = this.filteredRoutes.reduce((sum, route) => sum + (route.rating || 0), 0);
    this.averageRating = this.filteredRoutes.length > 0 ? ratingsSum / this.filteredRoutes.length : 0;
  }

  private extractCategories(): void {
    const categorySet = new Set<string>();
    this.routes.forEach(route => {
      if (route.category) {
        categorySet.add(route.category);
      }
    });
    this.categories = Array.from(categorySet);
  }

  private applyFilters(): void {
    this.filteredRoutes = this.routes.filter(route => {
      // Filtro por categoría
      if (this.currentFilters.category && route.category !== this.currentFilters.category) {
        return false;
      }

      // Filtro por dificultad
      if (this.currentFilters.difficulty && route.difficulty !== this.currentFilters.difficulty) {
        return false;
      }

      // Filtro por duración
      if (this.currentFilters.minDuration && route.estimatedTime && route.estimatedTime < this.currentFilters.minDuration) {
        return false;
      }

      if (this.currentFilters.maxDuration && route.estimatedTime && route.estimatedTime > this.currentFilters.maxDuration) {
        return false;
      }

      // Filtro por texto de búsqueda
      if (this.currentFilters.searchText) {
        const searchText = this.currentFilters.searchText.toLowerCase();
        const matchesName = route.name.toLowerCase().includes(searchText);
        const matchesDescription = route.description?.toLowerCase().includes(searchText);
        const matchesTags = route.tags?.some(tag => tag.toLowerCase().includes(searchText));

        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Filtro por tags
      if (this.currentFilters.tags && this.currentFilters.tags.length > 0) {
        const hasMatchingTag = this.currentFilters.tags.some(filterTag =>
          route.tags?.includes(filterTag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });

    // Limitar número de rutas mostradas
    if (this.maxRoutesToShow > 0) {
      this.filteredRoutes = this.filteredRoutes.slice(0, this.maxRoutesToShow);
    }

    this.calculateStats();
    this.cdr.markForCheck();
  }

  // Métodos de interacción de rutas
  toggleRouteExpansion(routeId: string): void {
    if (this.expandedRoutes.has(routeId)) {
      this.expandedRoutes.delete(routeId);
      this.emitRouteEvent('route_collapsed', this.getRouteById(routeId));
    } else {
      if (this.layoutMode === 'accordion') {
        // En modo accordion, solo una ruta expandida a la vez
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

  onRouteProviderSelected(route: Route, providerData: any): void {
    this.providerSelected.emit({ route, provider: providerData });
    this.emitRouteEvent('provider_selected', route, providerData);
  }

  onRouteMapInitialized(route: Route): void {
    console.log(`Mapa inicializado para ruta: ${route.name}`);
  }

  // Métodos de filtrado
  updateFilters(newFilters: Partial<RouteFilter>): void {
    this.currentFilters = { ...this.currentFilters, ...newFilters };
    this.applyFilters();
    this.filtersChanged.emit(this.currentFilters);
  }

  clearFilters(): void {
    this.currentFilters = {};
    this.applyFilters();
    this.filtersChanged.emit(this.currentFilters);
  }

  // Métodos de utilidad
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

  // Métodos para el template
  hasFilters(): boolean {
    return Object.keys(this.currentFilters).length > 0;
  }

  // Manejadores de eventos con tipo seguro
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateFilters({ searchText: target.value });
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilters({ category: target.value || undefined });
  }

  onDifficultyChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilters({ difficulty: target.value as any || undefined });
  }

  // Manejador de teclado para accesibilidad
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

  getDifficultyClass(difficulty?: string): string {
    switch (difficulty) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'difficulty-unknown';
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
    // Cuando los componentes del mapa cambian (por ejemplo, al expandir un nuevo acordeón),
    // necesitamos encontrar el nuevo y refrescarlo.
    this.mapComponents.changes.subscribe((comps: QueryList<RoutePoisShowComponent>) => {
      // Pequeño retraso para asegurar que el contenedor del acordeón sea visible
      setTimeout(() => {
        comps.forEach(mapComp => {
          if (mapComp && typeof mapComp.invalidateMapSize === 'function') {
            mapComp.invalidateMapSize();
          }
        });
      }, 10);
    });
  }
}
