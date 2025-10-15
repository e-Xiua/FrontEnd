import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MapService, mapServiceFactory } from '../../../../features/servicios/map/map.service';
import { ProveedorMapService } from '../../../../features/servicios/map/proveedores-map.service';
import { ServicioService } from '../../../../features/servicios/services/servicio.service';
import { usuarios } from '../../../models/usuarios';
import { LayoutAdapterService } from '../../../services/layout-adapter.service';
import { MapDisplayData, MapStateManager } from '../../../services/map-state-manager.service';
import { RouteTrackingService } from '../../../services/route-tracking.service';
import { ProviderDisplayStrategy } from '../../animations/model/display-strategy';
import { slideInAnimation } from '../../animations/slide.animations';
import { SlidePanelStrategy } from '../../animations/strategies/slide-panel-strategy';
import { ProviderCardComponent } from '../provider-card/provider-card.component';

export interface MapConfig {
  center?: [number, number];
  zoom?: number;
  tileLayerUrl?: string;
  tileLayerOptions?: any;
}

export interface MapPoiData {
  providers: usuarios[];
  config?: MapConfig;
  showRoutes?: boolean;
  showCarousel?: boolean;
  showProviderCard?: boolean;
}

@Component({
  selector: 'app-map-poi',
  templateUrl: './map-poi.component.html',
  styleUrls: ['./map-poi.component.css'],
  providers: [
    {
      provide: MapService,
      useFactory: mapServiceFactory
    }
  ],
  imports: [CommonModule, ProviderCardComponent],
  animations: [slideInAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class MapPoiComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() providers: usuarios[] = [];
  @Input() config: MapConfig = {
    center: [10.501005998543437, -84.6972559489806],
    zoom: 13,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; OpenStreetMap contributors'
    }
  };
  @Input() showRoutes: boolean = true;
  @Input() showCarousel: boolean = true;
  @Input() showProviderCard: boolean = true;
  @Input() autoSelectFirst: boolean = false;
  @Input() mapId: string = 'map';

  @Output() providerSelected = new EventEmitter<any>();
  @Output() mapInitialized = new EventEmitter<void>();

  // Propiedades del display data
  displayData: MapDisplayData | null = null;
  showProviderCardVisible: boolean = false;
  placeData: any = null;
  services: any[] = [];
  reviews: any[] = [];

  private displayStrategy: ProviderDisplayStrategy = new SlidePanelStrategy();
  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();

  // Layout adapter properties
  containerStyles: any = {};
  mapStyles: any = {};

  // Getters delegando al state manager
  get activeProvider(): any {
    return this.displayData && this.displayData.activeProviderIndex >= 0 && this.displayData.providerItems[this.displayData.activeProviderIndex]
      ? this.displayData.providerItems[this.displayData.activeProviderIndex].data
      : null;
  }

  get activeProviderName(): string {
    return this.displayData?.activeProviderName || 'Seleccionar proveedor';
  }

  get activeProviderIndex(): number {
    return this.displayData?.activeProviderIndex || -1;
  }

  get providerItems(): any[] {
    return this.displayData?.providerItems || [];
  }

  private postLayoutFix() {
    const map = this.mapService.getMapInstance();
    if (!map) return;
    requestAnimationFrame(() => map.invalidateSize());
  }

  constructor(
    private mapService: MapService,
    private proveedorMapService: ProveedorMapService,
    private servicioService: ServicioService,
    private mapStateManager: MapStateManager,
    private routeTrackingService: RouteTrackingService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private layoutAdapter: LayoutAdapterService
  ) {
    // Suscribirse a cambios en el estado del mapa
    const displayDataSub = this.mapStateManager.displayData$.subscribe(data => {
      this.displayData = data;
      this.cdr.markForCheck();
    });
    this.subscriptions.push(displayDataSub);

    // Suscribirse a cambios de proveedor activo para dibujar polylines
    const providerChangeSub = this.mapStateManager.state$.subscribe(state => {
      console.log('=== MapStateManager state change ===');
      console.log('Previous provider:', state.previousProvider?.nombre);
      console.log('Active provider:', state.activeProvider?.nombre);
      console.log('Previous index:', state.previousProviderIndex);
      console.log('Active index:', state.activeProviderIndex);

      // Solo dibujar polyline si hay proveedor anterior y actual válidos
      if (state.previousProvider && state.activeProvider &&
          state.previousProviderIndex !== state.activeProviderIndex &&
          state.previousProviderIndex >= 0) {

        console.log('Dibujando polyline desde', state.previousProvider.nombre, 'hacia', state.activeProvider.nombre);
        // Delay para asegurar que el flyTo termine antes de dibujar polyline
        // El método ya tiene skipZoomAdjustment configurado

          console.log('Ejecutando drawProviderNavigationRoute con skipZoomAdjustment...');
          this.drawProviderNavigationRoute(state.previousProvider, state.activeProvider);
      }

      // Forzar actualización de la vista cuando cambie el estado
      this.cdr.markForCheck();

      // detectChanges para inmediata propagación
      this.cdr.detectChanges();
    });
    this.subscriptions.push(providerChangeSub);

    // Integrar layout adapter pattern
    this.subscribeToLayoutAdapter();
  }

  private subscribeToLayoutAdapter(): void {
    // Suscribirse a estilos del contenedor principal
    this.layoutAdapter.mainContentStyle$
      .pipe(takeUntil(this.destroy$))
      .subscribe(styles => {
        this.containerStyles = {
          ...this.containerStyles,
          ...styles
        };
        this.cdr.markForCheck();
      });

    // Suscribirse a cambios de estado para invalidar el mapa
    this.layoutAdapter.layoutState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Invalidar tamaño del mapa cuando cambia el layout
        setTimeout(() => {
          const map = this.mapService.getMapInstance();
          if (map) {
            map.invalidateSize();
          }
        }, 300);
      });
  }

  @HostListener('window:resize')
  onWinResize() {
    const map = this.mapService.getMapInstance();
    if (map) {
      map.invalidateSize();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['providers'] && !changes['providers'].firstChange) {
      this.mapStateManager.setProviders(this.providers);
      this.handleProvidersChange();
    }

    if (changes['showCarousel'] || changes['showProviderCard'] || changes['showRoutes']) {
      this.mapStateManager.updateDisplayOptions({
        showCarousel: this.showCarousel,
        showProviderCard: this.showProviderCard,
        showRoutes: this.showRoutes
      });
    }

  }

  private initMap(): void {
    const mapConfig = {
      center: this.config.center || [10.501005998543437, -84.6972559489806],
      zoom: this.config.zoom || 13,
      tileLayerUrl: this.config.tileLayerUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      tileLayerOptions: this.config.tileLayerOptions || {
        attribution: '&copy; OpenStreetMap contributors'
      }
    };

    this.mapService.initMap(this.mapId, mapConfig);

    // Configurar RouteTrackingService con la instancia del mapa
    this.routeTrackingService.setMapInstance(this.mapService.getMapInstance());

    this.mapService.markerClick$.subscribe((providerData) => {
      this.onMarkerClick(providerData);
      setTimeout(() => {
        this.mapService.getMapInstance()?.invalidateSize();
      }, 0);
    });

    this.mapService.getMapInstance().on('click', () => {
      this.hideProviderCard();
    });

    this.mapInitialized.emit();
    this.handleProvidersChange();
    this.cdr.markForCheck();
  }

  private handleProvidersChange(): void {
    if (this.providers && this.providers.length > 0 && this.mapService.getMapInstance()) {
      this.handleProveedores(this.providers);
    }
  }

  private async handleProveedores(proveedores: usuarios[]): Promise<void> {
    try {
      const markerConfigs = this.proveedorMapService.createMarkerConfigs(proveedores);
      this.mapService.addMarkers(markerConfigs);
      this.mapService.setupTooltipVisibility(12);

      const coordinates = this.extractCoordinatesFromProviders(proveedores);

      // Actualizar el estado en el manager
      this.mapStateManager.setProviders(proveedores);

      this.lockMapBounds(coordinates);

      if (this.showRoutes && coordinates.length >= 2) {
        const routeData = await this.mapService.calculateOSRMRoute(coordinates);
        this.drawRouteFromOSRM(routeData);
      }

      this.cdr.markForCheck();
      this.postLayoutFix();
    } catch (error) {
      console.error('Error procesando proveedores:', error);
    }
  }

  private extractCoordinatesFromProviders(providers: usuarios[]): [number, number][] {
    return providers.map(provider => this.getProviderCoordinates(provider));
  }

  private lockMapBounds(coordinates: [number, number][]) {
    if (coordinates.length) {
      const bounds = this.mapService.createBounds(coordinates);
      this.mapService.fitBounds(bounds, { padding: [30, 30] });
      this.mapService.setMaxBounds(bounds.pad(0.12));
    }
  }

  // Métodos para navegación directa de proveedores
  goToPreviousProvider(): void {
    const currentState = this.mapStateManager.getCurrentState();
    const currentIndex = currentState.activeProviderIndex;

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      console.log('Going to previous provider, index:', newIndex);
      this.selectProvider(newIndex, 'navigation');
    } else {
      console.log('Already at first provider, cannot go to previous');
    }
  }

  goToNextProvider(): void {
    const currentState = this.mapStateManager.getCurrentState();
    const currentIndex = currentState.activeProviderIndex;

    if (currentIndex < currentState.providers.length - 1) {
      const newIndex = currentIndex + 1;
      console.log('Going to next provider, index:', newIndex);
      this.selectProvider(newIndex, 'navigation');
    } else {
      console.log('Already at last provider, cannot go to next');
    }
  }

  goToProviderIndex(index: number): void {
    console.log('Going to provider index:', index);
    this.selectProvider(index, 'navigation');
  }

  private navigateToProvider(provider: usuarios): void {
    console.log('=== Navigating to provider ===');
    console.log('Provider object:', provider);

    // Obtener posición del proveedor usando la misma lógica que ProveedorMapService
    const position = this.getProviderCoordinatesExtended(provider);
    console.log('Extracted coordinates:', position);

    if (position) {
      console.log(`Navegando a coordenadas:`, position);
      console.log('Calling mapService.flyTo with zoom 16...');

      // Hacer flyTo al proveedor con zoom adecuado
      this.mapService.flyTo(position, 16);

      console.log('FlyTo completed, calling postLayoutFix...');

    } else {
      console.warn('No se pudieron obtener coordenadas para el proveedor:', provider);
    }
  }

  private getProviderCoordinatesExtended(provider: usuarios): [number, number] | null {
    // Primero intentar con proveedorInfo
    if (provider.proveedorInfo?.latitud && provider.proveedorInfo?.longitud) {
      return [provider.proveedorInfo.latitud, provider.proveedorInfo.longitud];
    }
    if (provider.proveedorInfo?.lat && provider.proveedorInfo?.lng) {
      return [provider.proveedorInfo.lat, provider.proveedorInfo.lng];
    }

    // Luego intentar con la lógica de ProveedorMapService (nested objects)
    const info = Object.values(provider).find(
      (v) => v && typeof v === 'object' && 'coordenadaX' in v && 'coordenadaY' in v
    ) as { coordenadaX: string; coordenadaY: string } | undefined;

    if (info) {
      const lat = parseFloat(info.coordenadaX);
      const lng = parseFloat(info.coordenadaY);

      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }

    // Fallback a coordenadas por defecto
    console.warn('Usando coordenadas por defecto para proveedor:', provider.nombre);
    return [10.501005998543437, -84.6972559489806];
  }

  private getProviderCoordinates(provider: usuarios): [number, number] {
    const latitud = provider.proveedorInfo?.latitud || provider.proveedorInfo?.lat || 10.501005998543437;
    const longitud = provider.proveedorInfo?.longitud || provider.proveedorInfo?.lng || -84.6972559489806;
    return [latitud, longitud];
  }

  // Método legacy del carousel (ya no se usa pero mantenemos por compatibilidad)
  /**
   * Método central para manejar la selección de proveedores
   */
  private selectProvider(providerIndex: number, source: 'carousel' | 'marker' | 'navigation' = 'carousel'): void {
    console.log(`=== Select provider (source: ${source}) ===`);
    console.log('Provider index:', providerIndex);

    const currentState = this.mapStateManager.getCurrentState();

    if (!currentState.providers || providerIndex < 0 || providerIndex >= currentState.providers.length) {
      console.log('Invalid provider index or no providers available');
      return;
    }

    const selectedProvider = currentState.providers[providerIndex];
    console.log('Selected provider:', selectedProvider);

    // Si ya está activo, solo reactivar la card
    if (providerIndex === currentState.activeProviderIndex) {
      console.log('Provider already active, re-activating card only...');
      setTimeout(() => {
        this.activateProviderCard(selectedProvider);
        this.cdr.detectChanges();
      }, 50);
      return;
    }

    // Actualizar el estado
    this.mapStateManager.setActiveProviderIndex(providerIndex);
    console.log('MapStateManager updated to index:', providerIndex);

    // Navegación con delay mínimo
    setTimeout(() => {
      console.log(`Navigating to provider from ${source}...`);
      this.navigateToProvider(selectedProvider);
    }, 50);

    // Activación de card con delay un poco mayor
    setTimeout(() => {
      console.log(`Activating provider card from ${source}...`);
      this.activateProviderCard(selectedProvider);
    }, 100);

    // Emitir evento de selección
    this.providerSelected.emit(selectedProvider);
  }

  onCarouselProviderChange(newIndex: number): void {
    this.selectProvider(newIndex, 'carousel');
  }  private activateProviderCard(providerData: any): void {
    console.log('=== Activating provider card ===');
    console.log('Provider data:', providerData);
    console.log('showProviderCard flag:', this.showProviderCard);
    console.log('Display strategy available:', !!this.displayStrategy);

    // Verificar que tenemos todo lo necesario
    if (!this.showProviderCard) {
      console.log('showProviderCard is false, skipping card activation');
      return;
    }

    if (!this.displayStrategy) {
      console.error('Display strategy not available');
      return;
    }

    if (!providerData) {
      console.error('Provider data is null or undefined');
      return;
    }

    this.providerSelected.emit(providerData);

    console.log('Proceeding with card activation...');

    // Primero ocultar cualquier card existente
    try {
      this.displayStrategy.hide(this);
      console.log('Previous card hidden successfully');
    } catch (error) {
      console.error('Error hiding previous card:', error);
    }

    // Luego mostrar la nueva card con delay
    setTimeout(() => {
      try {
        console.log('Attempting to show provider card...');
        console.log('Provider data being passed to strategy:', providerData);

        this.displayStrategy.show(this, providerData);
        console.log('Display strategy show() called successfully');

        // Forzar actualización de la vista
        this.cdr.markForCheck();
        console.log('Change detection triggered');

      } catch (error) {
        console.error('Error showing provider card:', error);
      }
    }, 250);

    // Layout fix final
    setTimeout(() => {
      try {
        console.log('Final layout fix triggered');
        this.postLayoutFix();
      } catch (error) {
        console.error('Error in final layout fix:', error);
      }
    }, 500);
  }  private drawRouteFromOSRM(routeData: any): void {
    if (routeData.code === 'Ok' && routeData.routes?.length > 0) {
      const coordinates = routeData.routes[0].geometry.coordinates;
      const latLngs = coordinates.map((coord: [number, number]) =>
        [coord[1], coord[0]] as [number, number]
      );

      this.mapService.drawRoute({
        coordinates: latLngs,
        polylineOptions: {
          color: '#4285F4',
          weight: 6,
          opacity: 0.8
        }
      });
    }
  }

  onSubmitReview(event: any): void {
    console.log('Review submitted:', event);
    const newReview = {
      id: this.reviews.length + 1,
      author: 'Current User',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      date: 'Just now',
      rating: event.rating,
      comment: event.review,
      helpful: 0,
      notHelpful: 0
    };

    this.reviews.unshift(newReview);
  }

  onMarkerClick(providerData: any): void {
    console.log('=== Marker click triggered ===');
    console.log('Marker clicked:', providerData);

    // Encontrar el índice del proveedor clickeado
    const currentState = this.mapStateManager.getCurrentState();
    const providerIndex = currentState.providers.findIndex(p => {
      // Comparar por ID o nombre de empresa según disponibilidad
      return p.id === providerData.id ||
             (p.proveedorInfo?.nombre_empresa === providerData.nombre_empresa);
    });

    console.log('Provider index found:', providerIndex);

    if (providerIndex >= 0) {
      // Usar el método central de selección
      this.selectProvider(providerIndex, 'marker');
    } else {
      console.warn('Provider not found in current providers list');
      // Solo emitir si no se encontró el proveedor
      this.providerSelected.emit(providerData);
    }
  }

  /**
   * Dibuja una polyline de navegación entre el proveedor anterior y el actual
   */
  private async drawProviderNavigationRoute(fromProvider: any, toProvider: any): Promise<void> {
    try {
      await this.routeTrackingService.drawProviderNavigationRoute(
        fromProvider,
        toProvider,
        {
          routeColor: '#FF5722',
          routeWeight: 4,
          routeOpacity: 0.8,
          skipZoomAdjustment: true // Evitar que ajuste el zoom automáticamente
        }
      );
    } catch (error) {
      console.error('Error drawing provider navigation route:', error);
    }
  }

  hideProviderCard(): void {
    if (this.showProviderCard) {
      this.displayStrategy.hide(this);
      this.postLayoutFix();
    }
  }

  // Method called by display strategy to update visibility
  updateProviderCardVisibility(visible: boolean, data?: any): void {
    this.showProviderCardVisible = visible;
    if (visible && data) {
      this.placeData = data;
      // You can also set services and reviews here if needed
      this.services = data.servicios || [];
      this.reviews = data.reviews || [];
    }
    this.cdr.markForCheck();
  }
}
