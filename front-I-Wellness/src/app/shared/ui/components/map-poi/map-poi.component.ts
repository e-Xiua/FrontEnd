import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MapService, mapServiceFactory } from '../../../../features/servicios/map/map.service';
import { ProveedorMapService } from '../../../../features/servicios/map/proveedores-map.service';
import { ServicioService } from '../../../../features/servicios/services/servicio.service';
import { EnrichedProviderData } from '../../../models/route-generation';
import { LayoutAdapterService } from '../../../services/layout-adapter.service';
import { ProviderDisplayStrategy } from '../../animations/model/display-strategy';
import { slideInAnimation } from '../../animations/slide.animations';
import { SlidePanelStrategy } from '../../animations/strategies/slide-panel-strategy';
import { ProviderCardComponent } from '../provider-card/provider-card.component';
import { MapDisplayItem } from '../../../models/map-display.model';
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
  placeData: any = null;
  services: any[] = [];
  reviews: any[] = [];
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
      this.mapDisplayItems = this.items.map(provider => adaptEnrichedProviderToMapItem(provider));
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
    const latitud = provider.proveedorInfo?.latitud || provider.proveedorInfo?.lat || 10.501005998543437;
    const longitud = provider.proveedorInfo?.longitud || provider.proveedorInfo?.lng || -84.6972559489806;
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
    this.itemSelected.emit(providerData.id);
  }

  hideProviderCard(): void {
    if (this.showProviderCard) {
      this.displayStrategy.hide(this);
      this.postLayoutFix();
    }
  }

  updateProviderCardVisibility(visible: boolean, data?: any): void {
    this.showProviderCardVisible = visible;
    if (visible && data) {
      this.placeData = data;
      this.services = data.originalData.services || [];
      this.reviews = data.reviews || [];
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
