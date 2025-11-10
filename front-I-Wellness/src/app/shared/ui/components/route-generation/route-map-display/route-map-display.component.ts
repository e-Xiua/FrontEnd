import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { Subject, takeUntil } from 'rxjs';
import { MapService, mapServiceFactory } from '../../../../../features/servicios/map/map.service';
import { ProveedorMapService } from '../../../../../features/servicios/map/proveedores-map.service';
import { ServicioService } from '../../../../../features/servicios/services/servicio.service';
import { LayoutAdapterService } from '../../../../services/layout-adapter.service';
import { ProviderDisplayStrategy } from '../../../animations/model/display-strategy';
import { SlidePanelStrategy } from '../../../animations/strategies/slide-panel-strategy';
import { CarouselComponent } from '../../carousel/carousel.component';
import { LinkedItem } from '../../carousel/strategies/interface-carousel';
import { MapConfig } from '../../map-poi/map-poi.component';
import { ProviderCardComponent } from "../../provider-card/provider-card.component";

// Import new models
import {
  adaptOptimizedPoiToMapItem
} from '../../../../adapters/map-display.adapter';
import { MapDisplayItem } from '../../../../models/map-display.model';
import { OptimizationResult } from '../../../../models/optimization-job.models';
import { PlaceData } from '../../../../models/place-data.model';

/**
 * Route Map Display Component (Dumb/Presentational)
 *
 * Displays an optimized route on a Leaflet map with markers and polylines.
 * Refactored from route-pois-show to work with OptimizationResult.
 *
 * This is a pure presentational component that receives data via @Input
 * and emits events via @Output.
 */
@Component({
  selector: 'app-route-map-display',
  imports: [CarouselComponent, ProviderCardComponent, CommonModule],
  templateUrl: './route-map-display.component.html',
  styleUrl: './route-map-display.component.css',
  providers: [
    {
      provide: MapService,
      useFactory: mapServiceFactory
    }
  ],
  standalone: true
})
export class RouteMapDisplayComponent implements AfterViewInit, OnChanges, OnDestroy {

  // ========== INPUTS (Data from parent) ==========

  @Input() optimizedRoute: OptimizationResult | null = null;
  @Input() activeItemId: number | string | null = null;
  @Input() config: MapConfig = {
    center: [10.501005998543437, -84.6972559489806],
    zoom: 13,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; OpenStreetMap contributors'
    }
  };
  @Input() showCarousel: boolean = true;
  @Input() showProviderCard: boolean = true;
  @Input() mapId: string = 'route-map';
  @Input() adaptToLayout: boolean = true;
  // Layout controls
  @Input() panelWidthPercent: number = 40; // provider panel width when visible
  @Input() mapAspectRatio: number = 0.75;  // map height = width * ratio
  @Input() minMapHeight: number = 420;     // minimum map height
  @Input() maxViewportHeightFactor: number = 0.85; // cap by viewport
  @Input() providerHeightPercent: number = 60; // provider vs carousel split in the panel

  // ========== OUTPUTS (Events to parent) ==========

  @Output() itemSelected = new EventEmitter < number | string > ();
  @Output() nextClicked = new EventEmitter < void > ();
  @Output() previousClicked = new EventEmitter < void > ();
  @Output() goToIndexClicked = new EventEmitter < number > ();
  @Output() mapInitialized = new EventEmitter < void > ();

  // ========== LOCAL STATE ==========

  mapDisplayItems: MapDisplayItem[] = [];
  showProviderCardVisible: boolean = false;
  placeData: PlaceData | null = null;
  activeItem: MapDisplayItem | null = null;
  // Computed layout heights
  mapHeight: number = 0;
  providerSectionHeight: number = 0;
  carouselSectionHeight: number = 0;
  // Memoization: track last route to avoid recreating mapDisplayItems unnecessarily
  private lastOptimizedRouteId: string | null = null;


  private readonly displayStrategy: ProviderDisplayStrategy = new SlidePanelStrategy();
  @ViewChild(CarouselComponent) providerCarousel!: CarouselComponent;
  @ViewChild('mapContainer') mapContainerEl!: ElementRef<HTMLDivElement>;
  @ViewChild('panelWrapper') panelWrapperEl!: ElementRef<HTMLDivElement>;
  private readonly destroy$ = new Subject<void>();
  private resizeObserver?: ResizeObserver;

  // Layout adapter properties
  containerStyles: any = {};
  mapStyles: any = {};

  // ========== LIFECYCLE HOOKS ==========

  constructor(
    private readonly mapService: MapService,
    private readonly proveedorMapService: ProveedorMapService,
    private readonly servicioService: ServicioService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
    private readonly layoutAdapter: LayoutAdapterService
  ) {}

  @HostListener('window:resize')
  onWinResize() {
    const map = this.mapService.getMapInstance();
    if (map) {
      map.invalidateSize();
    }
    this.recomputeHeights();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.subscribeToLayoutAdapter();
    this.setupResizeObserver();
    setTimeout(() => this.recomputeHeights(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['optimizedRoute'] && this.optimizedRoute) {
      const currentRouteId = this.optimizedRoute.optimizedRouteId;

      // 🎯 OPTIMIZATION: Solo recrear mapDisplayItems si cambió realmente la ruta
      if (currentRouteId === this.lastOptimizedRouteId) {
        console.log('[RouteMapDisplay] Same route ID, skipping mapDisplayItems recreation', { routeId: currentRouteId });
        return;
      }

      this.lastOptimizedRouteId = currentRouteId;

      // 🗺️ LOGGING: Optimized route data received for map display
      console.log('=== 🗺️ ROUTE MAP DISPLAY - NEW OPTIMIZED ROUTE ===');
      console.log('Full optimized route object:', JSON.stringify(this.optimizedRoute, null, 2));

      console.log('Route summary:', {
        optimizedRouteId: this.optimizedRoute.optimizedRouteId,
        totalDistanceKm: this.optimizedRoute.totalDistanceKm,
        totalTimeMinutes: this.optimizedRoute.totalTimeMinutes,
        sequenceLength: this.optimizedRoute.optimizedSequence.length,
        optimizationAlgorithm: this.optimizedRoute.optimizationAlgorithm,
        optimizationScore: this.optimizedRoute.optimizationScore,
        generatedAt: this.optimizedRoute.generatedAt,
        hasMetadata: !!this.optimizedRoute.metadata
      });

      console.log('Optimized sequence details:', this.optimizedRoute.optimizedSequence.map((poi, idx) => ({
        sequenceOrder: idx + 1,
        poiId: poi.poiId,
        name: poi.name,
        position: [poi.latitude, poi.longitude],
        visitOrder: poi.visitOrder,
        estimatedVisitTime: poi.estimatedVisitTime,
        arrivalTime: poi.arrivalTime,
        departureTime: poi.departureTime,
        cost: poi.cost,
        category: poi.category,
        hasProviderData: !!poi.providerData
      })));

      console.log('========================================================');

      // Use NgZone to ensure proper change detection
      this.ngZone.run(() => {
        this.mapDisplayItems = this.optimizedRoute!.optimizedSequence.map((poi, index) => adaptOptimizedPoiToMapItem(poi, index));
        this.handleOptimizedRouteChange();
      });
    }
    if (changes['activeItemId']) {
      this.setActiveItem(this.activeItemId);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      try { this.resizeObserver.disconnect(); } catch {}
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== INITIALIZATION ==========

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
    this.handleOptimizedRouteChange();
    this.cdr.markForCheck();
  }

  // ========== DATA HANDLING ==========

  private handleOptimizedRouteChange(): void {
    if (this.optimizedRoute && this.mapService.getMapInstance()) {
      this.displayOptimizedRoute(this.optimizedRoute);
    }
  }

  /**
   * Convert OptimizationResult to map display format and render
   */
  private async displayOptimizedRoute(result: OptimizationResult): Promise < void > {
    try {
      // The logic to create markers is now based on mapDisplayItems
      const markerConfigs = this.mapDisplayItems.map(item => ({
        position: item.position,
        options: {
          icon: this.createNumberedIcon(item.number!),
          title: item.title
        },
        providerData: item.originalData.provider || {
          id: item.id,
          nombre_empresa: item.title,
          coordenadax: item.position[0],
          coordenaday: item.position[1]
        }
      }));

      this.mapService.addMarkers(markerConfigs);
      this.mapService.setupTooltipVisibility(12);

      const coordinates = this.mapDisplayItems.map(item => item.position);

      setTimeout(() => this.providerCarousel?.recalc?.(), 0);

      this.lockMapBounds(coordinates);

      // Draw route using OSRM
      if (coordinates.length >= 2) {
        const routeData = await this.mapService.calculateOSRMRoute(coordinates);
        this.drawRouteFromOSRM(routeData);
      }

      this.cdr.markForCheck();
      this.postLayoutFix();
    } catch (error) {
      console.error('Error displaying optimized route:', error);
    }
  }

  /**
   * Create numbered icon for markers (1, 2, 3, etc.)
   */
  private createNumberedIcon(number: number): L.DivIcon {
    return L.divIcon({
      html: `<div class="numbered-marker">${number}</div>`,
      className: 'custom-numbered-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  private lockMapBounds(coordinates: [number, number][]) {
    if (coordinates.length) {
      const bounds = this.mapService.createBounds(coordinates);
      this.mapService.fitBounds(bounds, { padding: [50, 50] });
      this.mapService.setMaxBounds(bounds.pad(0.15));
    }
  }

  // ========== EVENT HANDLERS ==========

  onCarouselProviderChange(ev: {
    index: number;item: LinkedItem
  }) {
    if (!ev?.item) return;
    const name = (ev.item as any)?.data?.nombre_empresa || (ev.item as any)?.data?.name || (ev.item as any)?.title;
    console.log('[RouteMapDisplay] carousel -> provider change', { index: ev.index, id: (ev.item as any)?.id, name });
    // Activar el item en el mapa y abrir su card
    this.setActiveItem(ev.item.id);
    this.itemSelected.emit(ev.item.id);
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
  }

  onMarkerClick(providerData: any): void {
    this.itemSelected.emit(providerData.id);
  }

  hideProviderCard(): void {
    if (this.showProviderCard) {
      this.displayStrategy.hide(this);
      setTimeout(() => this.postLayoutFix(), 320);
    }
  }

  // Method called by display strategy to update visibility
  updateProviderCardVisibility(visible: boolean, data?: MapDisplayItem): void {
    this.showProviderCardVisible = visible;
    if (visible && data?.originalData) {
      // data.originalData is already PlaceData from the adapter
      // Defensive: clone and sanitize to avoid later mutations (e.g., legacy adapters writing 'N/A')
      const incoming = data.originalData as any;
      // Debug trace to compare before/after
      console.log('➡️ [ROUTE-MAP] updateProviderCardVisibility incoming PlaceData:', incoming);
      const sanitizeNa = (v: unknown) => (v === 'N/A' ? undefined : v);
      this.placeData = {
        ...incoming,
        // Normalize known string placeholders to undefined so template defaults apply
        name: sanitizeNa(incoming.name),
        contactName: sanitizeNa(incoming.contactName),
        cargoContacto: sanitizeNa(incoming.cargoContacto),
        phone: sanitizeNa(incoming.phone),
        companyPhone: sanitizeNa(incoming.companyPhone),
        email: sanitizeNa(incoming.email),
        address: sanitizeNa(incoming.address),
        hours: sanitizeNa(incoming.hours),
        category: sanitizeNa(incoming.category),
        description: sanitizeNa(incoming.description),
        foto: incoming.foto ?? null
      } as PlaceData;
      console.log('✅ [ROUTE-MAP] updateProviderCardVisibility normalized PlaceData:', this.placeData);
    }
    this.recomputeHeights();
    this.cdr.markForCheck();
  }

  // ========== HELPER METHODS ==========

  private setActiveItem(itemId: number | string | null) {
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

  private setupResizeObserver(): void {
    const target = this.mapContainerEl?.nativeElement;
    if (!target || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => {
      this.recomputeHeights();
    });
    try { this.resizeObserver.observe(target); } catch {}
  }

  private recomputeHeights(): void {
    const container = this.mapContainerEl?.nativeElement;
    if (!container) return;
    const width = container.clientWidth || 0;
    const vpMax = Math.floor(window.innerHeight * this.maxViewportHeightFactor);
    let desired = Math.floor(width * this.mapAspectRatio);
    if (!Number.isFinite(desired) || desired <= 0) desired = this.minMapHeight;
    this.mapHeight = Math.max(this.minMapHeight, Math.min(desired, vpMax));

    if (this.showProviderCard && this.showProviderCardVisible) {
      // Panel mode: provider card + carousel stacked
      // Carousel ahora está fuera del panel pero calculamos su altura para el inline style
      const prov = Math.floor((this.mapHeight * this.providerHeightPercent) / 100);
      this.providerSectionHeight = Math.max(160, prov);
      this.carouselSectionHeight = Math.max(120, this.mapHeight - this.providerSectionHeight);
    } else {
      // Overlay mode: no provider card, carousel height auto (no inline height needed)
      this.providerSectionHeight = 0;
      this.carouselSectionHeight = 0; // carousel será auto-height en overlay
    }
  }

  private subscribeToLayoutAdapter(): void {
    if (!this.adaptToLayout) return;

    // Subscribe to container styles
    this.layoutAdapter.mainContentStyle$
      .pipe(takeUntil(this.destroy$))
      .subscribe(styles => {
        this.containerStyles = {
          ...this.containerStyles,
          ...styles
        };
        this.cdr.markForCheck();
      });

    // Subscribe to layout changes to invalidate map
    this.layoutAdapter.layoutState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          const map = this.mapService.getMapInstance();
          if (map) {
            map.invalidateSize();
          }
        }, 300);
      });
  }

  public invalidateMapSize(): void {
    setTimeout(() => {
      const map = this.mapService.getMapInstance();
      if (map) {
        map.invalidateSize();
        console.log(`Map ${this.mapId} invalidated and resized.`);
      }
    }, 0);
  }
}
