import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import * as L from 'leaflet';
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
  OptimizationResult,
  OptimizedPOI
} from '../../../../models/route-generation';
import {
  MapDisplayItem
} from '../../../../models/map-display.model';
import {
  adaptOptimizedPoiToMapItem
} from '../../../../adapters/map-display.adapter';

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

  // ========== OUTPUTS (Events to parent) ==========

  @Output() itemSelected = new EventEmitter < number | string > ();
  @Output() nextClicked = new EventEmitter < void > ();
  @Output() previousClicked = new EventEmitter < void > ();
  @Output() goToIndexClicked = new EventEmitter < number > ();
  @Output() mapInitialized = new EventEmitter < void > ();

  // ========== LOCAL STATE ==========

  mapDisplayItems: MapDisplayItem[] = [];
  showProviderCardVisible: boolean = false;
  placeData: any = null;
  services: any[] = [];
  reviews: any[] = [];
  activeItem: MapDisplayItem | null = null;


  private displayStrategy: ProviderDisplayStrategy = new SlidePanelStrategy();
  @ViewChild(CarouselComponent) providerCarousel!: CarouselComponent;
  private destroy$ = new Subject<void>();

  // Layout adapter properties
  containerStyles: any = {};
  mapStyles: any = {};

  // ========== LIFECYCLE HOOKS ==========

  constructor(
    private mapService: MapService,
    private proveedorMapService: ProveedorMapService,
    private servicioService: ServicioService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private layoutAdapter: LayoutAdapterService
  ) {}

  @HostListener('window:resize')
  onWinResize() {
    const map = this.mapService.getMapInstance();
    if (map) {
      map.invalidateSize();
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.subscribeToLayoutAdapter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['optimizedRoute'] && this.optimizedRoute) {
      this.mapDisplayItems = this.optimizedRoute.optimizedSequence.map((poi, index) => adaptOptimizedPoiToMapItem(poi, index));
      this.handleOptimizedRouteChange();
    }
    if (changes['activeItemId']) {
      this.setActiveItem(this.activeItemId);
    }
  }

  ngOnDestroy(): void {
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
        providerData: {
          id: item.id,
          ...item.originalData
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
      setTimeout(() => this.postLayoutFix(), 320);
    }
  }

  // Method called by display strategy to update visibility
  updateProviderCardVisibility(visible: boolean, data ? : any): void {
    this.showProviderCardVisible = visible;
    if (visible && data) {
      this.placeData = data.originalData;
      this.services = data.originalData.services || [];
      this.reviews = data.originalData.reviews || [];
    }
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
