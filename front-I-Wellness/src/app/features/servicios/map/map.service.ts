import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Subject } from 'rxjs';

export interface MapConfig {
  center: [number, number];
  zoom: number;
  tileLayerUrl: string;
  tileLayerOptions?: L.TileLayerOptions;
}

export interface ProviderData {
  id: number | string;
  nombre_empresa: string;
  foto?: string;
  categoria?: string;
  rating: number;
  totalReviews: number;
  address?: string;
  hours?: string;
  description?: string;
  nombre?: string;              // contacto
  correo?: string;
  telefono?: string;
  telefonoEmpresa?: string;
  cargoContacto?: string;
  certificadosCalidad?: string | null;
  identificacionFiscal?: string | null;
  licenciasPermisos?: string | null;
  position?: [number, number];  // opcional (útil para carrusel / centrar mapa)
}

export interface MarkerConfig {
  position: [number, number];
  popupContent?: string;
  tooltipContent?: string;
  icon?: L.Icon | L.DivIcon;
  providerData?: ProviderData;
}

export interface ServiceCardConfig {
  nombre_empresa: string;
  foto: L.Icon | string;
  nombreContacto: string;
  telefono: string;
  telefonoEmpresa: string;
  email: string;
  rating: number;
  totalReviews: number;
  address: string;
  hours: string;
  description: string;
  position?: [number, number];
}

export interface RouteConfig {
  coordinates: [number, number][];
  polylineOptions?: L.PolylineOptions;
}

// Factory function
export function mapServiceFactory(): MapService {
  const service = new MapService();
  service.configureLeafletIcons();
  return service;
}

@Injectable()
export class MapService {
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private polylines: L.Polyline[] = [];
  private tooltips: L.Tooltip[] = [];
  private iconsConfigured = false;

  constructor() {
    // El constructor ya no configura los iconos automáticamente
    // La configuración se hace en el factory
  }

  private markerClickSubject = new Subject<ServiceCardConfig>();
  public markerClick$ = this.markerClickSubject.asObservable();

  configureLeafletIcons(): void {
    if (this.iconsConfigured) return;

    // ← elimina la búsqueda por defecto
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    // ← Configuración de iconos
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
      iconUrl: '/assets/leaflet/marker-icon.png',
      shadowUrl: '/assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.iconsConfigured = true;
  }

  // Método para verificar si los iconos están configurados
  areIconsConfigured(): boolean {
    return this.iconsConfigured;
  }

  initMap(mapId: string, config: MapConfig): L.Map {
    // Asegurar que los iconos estén configurados
    if (!this.iconsConfigured) {
      this.configureLeafletIcons();
    }

    this.map = L.map(mapId, {
      center: config.center,
      zoom: config.zoom
    });

    L.tileLayer(config.tileLayerUrl, config.tileLayerOptions).addTo(this.map);
    return this.map;
  }

  addMarkers(markerConfigs: MarkerConfig[]): L.Marker[] {
    // Asegurar que los iconos estén configurados
    if (!this.iconsConfigured) {
      this.configureLeafletIcons();
    }

    this.configureLeafletIcons();

    this.markers = markerConfigs.map(config => {
      const markerOptions: L.MarkerOptions = config.icon ? { icon: config.icon } : {};

      const marker = L.marker(config.position, markerOptions).addTo(this.map);

      if (config.popupContent) {
        marker.bindPopup(config.popupContent);
      }

      if (config.tooltipContent) {
        const tooltip = marker.bindTooltip(config.tooltipContent, {
          permanent: false,
          direction: 'bottom',
          offset: [0, 10],
          className: 'custom-tooltip'
        }).getTooltip();

        if (tooltip) {
          this.tooltips.push(tooltip);
        }
      }

      marker.on('click', () => {
        if ((config as any).providerData) {
          this.markerClickSubject.next((config as any).providerData);
        }
      });

      return marker;
    });

    return this.markers;
  }

  // ... el resto de los métodos permanece igual ...
  drawRoute(routeConfig: RouteConfig): L.Polyline {
    const polyline = L.polyline(routeConfig.coordinates, {
      color: '#4285F4',
      weight: 6,
      opacity: 0.8,
      lineJoin: 'round',
      ...routeConfig.polylineOptions
    }).addTo(this.map);

    this.polylines.push(polyline);

    if (routeConfig.coordinates.length > 0) {
      const bounds = L.latLngBounds(routeConfig.coordinates);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }

    return polyline;
  }

  async calculateOSRMRoute(coordinates: [number, number][]): Promise<any> {
    if (coordinates.length < 2) {
      throw new Error('Se necesitan al menos 2 coordenadas');
    }

    const coordinatesString = coordinates
      .map(coord => `${coord[1]},${coord[0]}`)
      .join(';');

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error(`OSRM responded with status: ${response.status}`);
    }

    return await response.json();
  }

  clearMap(): void {
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.polylines.forEach(polyline => this.map.removeLayer(polyline));
    this.tooltips = [];
    this.markers = [];
    this.polylines = [];
  }

  getMapInstance(): L.Map {
    console.log('Map instance requested:', this.map);
    return this.map;
  }

  setupTooltipVisibility(minZoom: number = 12): void {
    this.map.on('zoomend moveend', () => {
      const zoom = this.map.getZoom();
      this.tooltips.forEach(tooltip => {
        const el = tooltip.getElement();
        if (el) {
          el.style.display = zoom < minZoom ? 'none' : 'block';
        }
      });
    });
  }

  createBounds(points: [number, number][]) {
  return (window as any).L.latLngBounds(points.map(p => (window as any).L.latLng(p[0], p[1])));
}

fitBounds(bounds: any, options?: any) {
  this.map?.fitBounds(bounds, options);
}

flyTo(position: [number, number], zoom: number = 15) {
  this.map?.flyTo(position, zoom, { duration: 0.75 });
}

setMaxBounds(bounds: any) {
  this.map?.setMaxBounds(bounds);
  (this.map as any).options.maxBoundsViscosity = 1.0;
}


}
