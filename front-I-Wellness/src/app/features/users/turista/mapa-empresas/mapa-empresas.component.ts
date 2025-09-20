import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { usuarios } from '../../../../shared/models/usuarios';
import { ProviderDisplayStrategy } from '../../../../shared/ui/animations/model/display-strategy';
import { slideInAnimation } from '../../../../shared/ui/animations/slide.animations';
import { SlidePanelStrategy } from '../../../../shared/ui/animations/strategies/slide-panel-strategy';
import { CarouselComponent } from '../../../../shared/ui/components/carousel/carousel.component';
import { LinkedItem } from '../../../../shared/ui/components/carousel/strategies/interface-carousel';
import { ProviderCardComponent } from '../../../../shared/ui/components/provider-card/provider-card.component';
import { MapService, mapServiceFactory } from '../../../servicios/map/map.service';
import { ProveedorMapService } from '../../../servicios/map/proveedores-map.service';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-mapa-empresas',
  templateUrl: './mapa-empresas.component.html',
  styleUrls: ['./mapa-empresas.component.css'],
  providers: [
    {
      provide: MapService,
      useFactory: mapServiceFactory
    }
  ],
  imports: [CommonModule, ProviderCardComponent, CarouselComponent],
  animations: [slideInAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapaEmpresasComponent implements AfterViewInit {

  showProviderCard: boolean = false;

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
    private usuarioServicio: UsuarioService,
    private servicioService: ServicioService,
    private router: Router,
    private mapService: MapService,
    private proveedorMapService: ProveedorMapService,
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

    this.mapService.markerClick$.subscribe((providerData) => {
    this.onMarkerClick(providerData);
    setTimeout(() => {
      this.mapService.getMapInstance()?.invalidateSize();
    }, 0);
  });

  this.mapService.getMapInstance().on('click', () => {
      this.hideProviderCard();
    });


    this.cdr.markForCheck();

  }

  private initMap(): void {
    const mapConfig = {
      center: [10.501005998543437, -84.6972559489806] as [number, number],
      zoom: 13,
      tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      tileLayerOptions: {
        attribution: '&copy; OpenStreetMap contributors'
      }
    };

    this.mapService.initMap('map', mapConfig);

    this.usuarioServicio.obtenerProveedores().subscribe({
      next: (proveedores) =>  {this.handleProveedores(proveedores)
        console.log('Proveedores obtenidos:', proveedores);
      },
      error: (err) => console.error('Error al obtener proveedores', err),
    });
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

      if (coordinates.length >= 2) {
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

    this.reviews.unshift(newReview); // Add to beginning of array
  }


  onMarkerClick(providerData: any): void {
    console.log('Marker clicked:', providerData);
    // Only hide if the card is currently visible to avoid redundant hide calls

      this.displayStrategy.hide(this);
      // Wait for hide animation (300ms) before showing new card
      setTimeout(() => {
        this.displayStrategy.show(this, providerData);
      }, 300); // Match animation duration from slide.animations.ts

      setTimeout(() => {
      this.postLayoutFix();// por si cambia ancho al mostrar card
    }, 320);

  }

hideProviderCard(): void {
    this.displayStrategy.hide(this);
    setTimeout(() => this.postLayoutFix(), 320);
  }
}
