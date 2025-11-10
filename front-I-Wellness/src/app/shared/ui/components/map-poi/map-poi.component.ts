import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MapService, mapServiceFactory } from '../../../../features/servicios/map/map.service';
import { ProveedorMapService } from '../../../../features/servicios/map/proveedores-map.service';
import { ServicioService } from '../../../../features/servicios/services/servicio.service';
import { EnrichedProviderData } from '../../../models/provider.models';
import { LayoutAdapterService } from '../../../services/layout-adapter.service';
import { ProviderDisplayStrategy } from '../../animations/model/display-strategy';
import { slideInAnimation } from '../../animations/slide.animations';
import { SlidePanelStrategy } from '../../animations/strategies/slide-panel-strategy';
import { ProviderCardComponent } from '../provider-card/provider-card.component';
import { MapDisplayItem } from '../../../models/map-display.model';
import { PlaceData } from '../../../models/place-data.model';
import { adaptEnrichedProviderToMapItem } from '../../../adapters/map-display.adapter';

export interface MapConfig {
  center?: [number, number];
  zoom?: number;
  tileLayerUrl?: string;
  tileLayerOptions?: any;
}

export interface MapPoiData {
  providers: EnrichedProviderData[];
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
  @Input() items: EnrichedProviderData[] = [];
  @Input() activeItemId: number | string | null = null;
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

  @Output() itemSelected = new EventEmitter<number | string>();
  @Output() nextClicked = new EventEmitter<void>();
  @Output() previousClicked = new EventEmitter<void>();
  @Output() goToIndexClicked = new EventEmitter<number>();
  @Output() mapInitialized = new EventEmitter<void>();

  // Local UI state
  mapDisplayItems: MapDisplayItem[] = [];
  showProviderCardVisible: boolean = false;
  placeData: PlaceData | null = null;
  activeItem: MapDisplayItem | null = null;

  private displayStrategy: ProviderDisplayStrategy = new SlidePanelStrategy();
  private destroy$ = new Subject<void>();

  // Layout adapter properties
  containerStyles: any = {};
  mapStyles: any = {};

  constructor(
    private mapService: MapService,
    private proveedorMapService: ProveedorMapService,
    private servicioService: ServicioService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private layoutAdapter: LayoutAdapterService
  ) {
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      console.log('=== 🔍 MAP POI COMPONENT - RAW ENRICHED PROVIDER DATA ===');
      console.log('Total items received:', this.items.length);
      console.log('Full items array:', JSON.stringify(this.items, null, 2));
      
      if (this.items.length > 0) {
        console.log('📋 First item detailed structure:');
        console.log('  - Full object:', this.items[0]);
        console.log('  - provider object:', this.items[0].provider);
        console.log('  - user object:', (this.items[0] as any).user);
        console.log('  - provider.id:', this.items[0].provider?.id);
        console.log('  - provider.nombre_empresa:', this.items[0].provider?.nombre_empresa);
        console.log('  - provider.telefono:', this.items[0].provider?.telefono);
        console.log('  - provider.cargoContacto:', this.items[0].provider?.cargoContacto);
        console.log('  - categories:', this.items[0].categories);
        console.log('  - services:', this.items[0].services);
        console.log('  - averageCost:', this.items[0].averageCost);
        console.log('  - averageVisitDuration:', this.items[0].averageVisitDuration);
      }
      console.log('========================================================');
      
      this.mapDisplayItems = this.items.map(provider => {
        console.log('🔄 Adaptando proveedor a MapDisplayItem:', provider);
        const adapted = adaptEnrichedProviderToMapItem(provider);
        console.log('✅ Resultado adaptado:', adapted);
        console.log('📦 placeData creado:', adapted.originalData);
        return adapted;
      });
      this.handleProvidersChange();
    }
    if (changes['activeItemId'] && this.mapDisplayItems.length > 0) {
      this.setActiveItem(this.activeItemId);
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

    this.mapService.markerClick$.subscribe((providerData) => {
      this.onMarkerClick(providerData);
    });

    this.mapService.getMapInstance().on('click', () => {
      this.hideProviderCard();
    });

    this.mapInitialized.emit();
    this.handleProvidersChange();
    this.cdr.markForCheck();
  }

  private handleProvidersChange(): void {
    if (this.items && this.items.length > 0 && this.mapService.getMapInstance()) {
      this.handleProveedores(this.items);
    }
  }

  private async handleProveedores(providers: EnrichedProviderData[]): Promise<void> {
    try {
      const backendProviders = providers.map(p => p.provider);
      const markerConfigs = this.proveedorMapService.createMarkerConfigs(backendProviders);
      this.mapService.addMarkers(markerConfigs);
      this.mapService.setupTooltipVisibility(12);

      const coordinates = this.extractCoordinatesFromProviders(backendProviders);

      this.lockMapBounds(coordinates);

      if (this.showRoutes && coordinates.length >= 2) {
        const routeData = await this.mapService.calculateOSRMRoute(coordinates);
        this.drawRouteFromOSRM(routeData);
      }

      if (this.autoSelectFirst && this.items.length > 0) {
        this.itemSelected.emit(this.items[0].provider.id);
      }

      this.cdr.markForCheck();
      this.postLayoutFix();
    } catch (error) {
      console.error('Error procesando proveedores:', error);
    }
  }

  private extractCoordinatesFromProviders(providers: any[]): [number, number][] {
    return providers.map(provider => this.getProviderCoordinates(provider));
  }

  private lockMapBounds(coordinates: [number, number][]) {
    if (coordinates.length) {
      const bounds = this.mapService.createBounds(coordinates);
      this.mapService.fitBounds(bounds, { padding: [30, 30] });
      this.mapService.setMaxBounds(bounds.pad(0.12));
    }
  }

  private getProviderCoordinates(provider: any): [number, number] {
    // Backend returns coordinates as coordenadaX/coordenadaY (strings that need parsing)
    // Try proveedorInfo first (nested), then fall back to top-level provider properties
    const latStr = provider.proveedorInfo?.coordenadaX || provider.coordenadaX;
    const lngStr = provider.proveedorInfo?.coordenadaY || provider.coordenadaY;
    
    // Parse to floats, with fallback to default Costa Rica coordinates
    const latitud = latStr ? parseFloat(latStr) : 10.501005998543437;
    const longitud = lngStr ? parseFloat(lngStr) : -84.6972559489806;
    
    return [latitud, longitud];
  }

  private drawRouteFromOSRM(routeData: any): void {
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
    // This functionality might need to be moved or handled differently
    // as the component no longer manages reviews directly.
    // For now, we'll just log it.
  }

  onMarkerClick(providerData: any): void {
    this.itemSelected.emit(providerData.id);
  }

  hideProviderCard(): void {
    if (this.showProviderCard) {
      this.displayStrategy.hide(this);
      this.postLayoutFix();
    }
  }

  updateProviderCardVisibility(visible: boolean, data?: MapDisplayItem): void {
    this.showProviderCardVisible = visible;
    if (visible && data && data.originalData) {
      // data.originalData is already PlaceData from the adapter
      this.placeData = data.originalData;
    }
    this.cdr.markForCheck();
  }

  getActiveIndex(): number {
    if (!this.activeItemId || !this.mapDisplayItems) {
      return -1;
    }
    return this.mapDisplayItems.findIndex(i => i.id === this.activeItemId);
  }

  private setActiveItem(itemId: number | string | null): void {
    if (itemId === null) {
      this.activeItem = null;
      this.hideProviderCard();
      return;
    }

    const item = this.mapDisplayItems.find(i => i.id === itemId);
    if (item) {
      this.activeItem = item;
      this.mapService.flyTo(item.position, 16);
      this.activateProviderCard(item);
      this.cdr.markForCheck();
    }
  }

  private activateProviderCard(item: MapDisplayItem): void {
    if (!this.showProviderCard) return;

    this.displayStrategy.hide(this);
    setTimeout(() => {
      this.displayStrategy.show(this, item);
    }, 250);

    setTimeout(() => {
      this.postLayoutFix();
    }, 500);
  }

  private postLayoutFix() {
    const map = this.mapService.getMapInstance();
    if (!map) return;
    requestAnimationFrame(() => map.invalidateSize());
  }
}
