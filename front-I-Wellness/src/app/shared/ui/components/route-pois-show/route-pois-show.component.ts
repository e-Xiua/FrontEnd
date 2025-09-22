import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MapService, mapServiceFactory } from '../../../../features/servicios/map/map.service';
import { ProveedorMapService } from '../../../../features/servicios/map/proveedores-map.service';
import { ServicioService } from '../../../../features/servicios/services/servicio.service';
import { usuarios } from '../../../models/usuarios';
import { ProviderDisplayStrategy } from '../../animations/model/display-strategy';
import { SlidePanelStrategy } from '../../animations/strategies/slide-panel-strategy';
import { CarouselComponent } from '../carousel/carousel.component';
import { LinkedItem } from '../carousel/strategies/interface-carousel';
import { MapConfig } from '../map-poi/map-poi.component';
import { ProviderCardComponent } from "../provider-card/provider-card.component";

@Component({
  selector: 'app-route-pois-show',
  imports: [CarouselComponent, ProviderCardComponent, CommonModule],
  templateUrl: './route-pois-show.component.html',
  styleUrl: './route-pois-show.component.css',
    providers: [
    {
      provide: MapService,
      useFactory: mapServiceFactory
    }
  ],
})
export class RoutePoisShowComponent implements AfterViewInit, OnChanges {

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
  @Input() mapId: string = 'map';

  @Output() providerSelected = new EventEmitter<any>();
  @Output() mapInitialized = new EventEmitter<void>();

  showProviderCardVisible: boolean = false;
  selectedProviderId: number | null = null;
  placeData: any = null;
  services: any[] = [];
  reviews: any[] = [];
  providerItems: LinkedItem[] = [];

  private displayStrategy: ProviderDisplayStrategy = new SlidePanelStrategy();
  @ViewChild(CarouselComponent) providerCarousel!: CarouselComponent;

  private postLayoutFix() {
    const map = this.mapService.getMapInstance();
    if (!map) return;
    requestAnimationFrame(() => map.invalidateSize());
  }

  constructor(
    private mapService: MapService,
    private proveedorMapService: ProveedorMapService,
    private servicioService: ServicioService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['providers'] && !changes['providers'].firstChange) {
      this.handleProvidersChange();
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

      const coordinates = this.proveedorMapService.extractCoordinates(proveedores);

      this.providerItems = markerConfigs.map(mc => ({
        id: mc.providerData?.id,
        position: (mc.position) as [number, number],
        data: mc.providerData
      }));

      setTimeout(() => this.providerCarousel?.recalc?.(), 0);

      this.lockMapBounds();

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

  private lockMapBounds() {
    const coords = this.providerItems
      .map(i => i.position)
      .filter((p): p is [number, number] => !!p);

    if (coords.length) {
      const bounds = this.mapService.createBounds(coords);
      this.mapService.fitBounds(bounds, { padding: [30, 30] });
      this.mapService.setMaxBounds(bounds.pad(0.12));
    }
  }

  onCarouselProviderChange(ev: { index: number; item: LinkedItem }) {
    if (!ev?.item) return;
    if (ev.item.position) {
      this.mapService.flyTo(ev.item.position, 15);
    }
    this.onMarkerClick(ev.item.data);
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
    console.log('Marker clicked:', providerData);
    console.log('showProviderCard input:', this.showProviderCard);
    this.providerSelected.emit(providerData);

    if (this.showProviderCard) {
      console.log('Showing provider card with strategy');
      this.displayStrategy.hide(this);
      setTimeout(() => {
        this.displayStrategy.show(this, providerData);
      }, 300);

      setTimeout(() => {
        this.postLayoutFix();
      }, 320);
    }
  }

  hideProviderCard(): void {
    if (this.showProviderCard) {
      this.displayStrategy.hide(this);
      setTimeout(() => this.postLayoutFix(), 320);
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
