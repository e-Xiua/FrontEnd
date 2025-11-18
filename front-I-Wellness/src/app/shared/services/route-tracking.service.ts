import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class RouteTrackingService {
  private mapInstance: L.Map | null = null;
  private providerNavigationPolyline: L.Polyline | null = null; // Polyline para navegación entre proveedores

  constructor() {}

  /**
   * Configura la instancia del mapa para dibujar rutas
   */
  setMapInstance(map: L.Map): void {
    this.mapInstance = map;
  }

  /**
   * Dibuja una polyline entre dos proveedores y ajusta el zoom
   */
  async drawProviderNavigationRoute(
    fromProvider: any,
    toProvider: any,
    options?: {
      routeColor?: string;
      routeWeight?: number;
      routeOpacity?: number;
      skipZoomAdjustment?: boolean;
    }
  ): Promise<void> {
    if (!this.mapInstance || !fromProvider || !toProvider) {
      console.warn('Map instance, fromProvider or toProvider not available for navigation route');
      return;
    }

    // Limpiar polyline anterior
    this.clearProviderNavigationRoute();

    // Obtener coordenadas de los proveedores
    const fromCoords = this.getProviderCoordinates(fromProvider);
    const toCoords = this.getProviderCoordinates(toProvider);

    if (!fromCoords || !toCoords) {
      console.warn('Could not extract coordinates from providers');
      return;
    }

    try {
      console.log('Intentando calcular ruta OSRM entre proveedores');

      // Intentar obtener ruta de OSRM
      const osrmResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=full&geometries=geojson`
      );

      if (osrmResponse.ok) {
        const osrmData = await osrmResponse.json();

        if (osrmData.routes && osrmData.routes.length > 0) {
          const routeCoordinates = osrmData.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );

          // Crear polyline con ruta de OSRM
          this.providerNavigationPolyline = L.polyline(routeCoordinates, {
            color: options?.routeColor || '#FF5722',
            weight: options?.routeWeight || 4,
            opacity: options?.routeOpacity || 0.8
          }).addTo(this.mapInstance);

          console.log('Ruta OSRM dibujada exitosamente entre proveedores');

          // Ajustar zoom solo si no se especifica skipZoomAdjustment
          if (!options?.skipZoomAdjustment) {
            this.fitBoundsToProviders([fromProvider, toProvider]);
          }

          return;
        }
      }
    } catch (error) {
      console.warn('Error al obtener ruta OSRM, usando línea directa:', error);
    }

    // Fallback: línea directa
    this.drawDirectProviderLine(fromCoords, toCoords, options);
  }

  /**
   * Dibuja una línea directa entre dos coordenadas
   */
  private drawDirectProviderLine(
    fromCoords: [number, number],
    toCoords: [number, number],
    options?: {
      routeColor?: string;
      routeWeight?: number;
      routeOpacity?: number;
      skipZoomAdjustment?: boolean;
    }
  ): void {
    if (!this.mapInstance) return;

    console.log('Dibujando línea directa entre proveedores');

    this.providerNavigationPolyline = L.polyline([fromCoords, toCoords], {
      color: options?.routeColor || '#FF5722',
      weight: options?.routeWeight || 4,
      opacity: options?.routeOpacity || 0.8
    }).addTo(this.mapInstance);

    // Ajustar zoom solo si no se especifica skipZoomAdjustment
    if (!options?.skipZoomAdjustment) {
      const bounds = L.latLngBounds([fromCoords, toCoords]);
      this.mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Limpia la polyline de navegación entre proveedores
   */
  clearProviderNavigationRoute(): void {
    if (this.providerNavigationPolyline && this.mapInstance) {
      this.mapInstance.removeLayer(this.providerNavigationPolyline);
      this.providerNavigationPolyline = null;
    }
  }

  /**
   * Obtiene las coordenadas de un proveedor
   */
  private getProviderCoordinates(provider: any): [number, number] | null {
    // Primer intento: proveedorInfo
    if (provider.proveedorInfo?.latitud && provider.proveedorInfo?.longitud) {
      return [provider.proveedorInfo.latitud, provider.proveedorInfo.longitud];
    }
    if (provider.proveedorInfo?.lat && provider.proveedorInfo?.lng) {
      return [provider.proveedorInfo.lat, provider.proveedorInfo.lng];
    }

    // Segundo intento: nested objects (lógica similar a ProveedorMapService)
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

    console.warn('No se pudieron extraer coordenadas del proveedor:', provider);
    return null;
  }

  /**
   * Ajusta el zoom para mostrar múltiples proveedores
   */
  private fitBoundsToProviders(providers: any[]): void {
    if (!this.mapInstance || providers.length === 0) return;

    const coordinates: [number, number][] = [];

    providers.forEach(provider => {
      const coords = this.getProviderCoordinates(provider);
      if (coords) {
        coordinates.push(coords);
      }
    });

    if (coordinates.length === 1) {
      this.mapInstance.setView(coordinates[0], 16);
    } else if (coordinates.length > 1) {
      const bounds = L.latLngBounds(coordinates);
      this.mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}
