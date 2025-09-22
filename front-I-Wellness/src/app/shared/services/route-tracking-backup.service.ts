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
  setAllProviders(providers: any[]): void {
    this.allProviders = providers;
  }

  /**
   * Inicia el rastreo de ruta para un usuario
   */
  startTracking(userId: string, initialPosition: [number, number]): void {
    const initialPoint: RoutePoint = {
      position: initialPosition,
      timestamp: new Date(),
      accuracy: 0
    };

    const userRoute: UserRoute = {
      userId,
      segments: [],
      currentPosition: initialPoint,
      isActive: true,
      startTime: new Date(),
      lastUpdateTime: new Date()
    };

    this.activeRoutes.set(userId, userRoute);
    this.notifyRouteUpdate();
  }

  /**
   * Dibuja la polyline de la ruta en el mapa y ajusta el zoom
   */
  drawRoutePolylineAndZoom(userId: string): void {

    if (!this.mapInstance) {
    console.warn('Mapa no configurado. Llama a setMapInstance() primero.');
    return;
  }

  // Limpiar solo si hay demasiadas rutas activas
  if (this.routePolylines.size > this.maxActiveRoutes) {
    this.clearOldestRoute();
  }

  const userRoute = this.activeRoutes.get(userId);
  if (!userRoute) {
    console.warn(`No se encontró ruta para usuario: ${userId}`);
    return;
  }

  // Limpiar polylines anteriores del usuario
  this.clearUserPolylines(userId);

  if (userRoute.segments.length === 0) {
    // Primera posición - mostrar zoom con todos los proveedores
    this.zoomToAllProviders();
    return;
  }

  // Usar un solo polyline en lugar de múltiples
  const completeRoute = this.getCompleteRoute(userId);
  if (completeRoute.length > 1) {
    const polyline = L.polyline(completeRoute, {
      color: '#FF6B6B',
      weight: 3, // Reducido de 5 a 3
      opacity: 0.7, // Reducido de 0.8 a 0.7
      // Removed dashArray to reduce GPU usage
    });

    // Agregar al grupo de layers en lugar de directamente al mapa
    if (!this.mapLayers) {
      this.mapLayers = new L.LayerGroup().addTo(this.mapInstance);
    }

    polyline.addTo(this.mapLayers);

    // Guardar referencia simplificada
    this.routePolylines.set(userId, [polyline]);

    this.zoomToUserRoute(completeRoute);
  }

    // Reutilizar marcador de posición actual
  this.updateCurrentPositionMarkerEfficient(userId, userRoute.currentPosition);
}

  private zoomToUserRoute(routeCoordinates: [number, number][]): void {
    if (!this.mapInstance || routeCoordinates.length === 0) return;

    if (routeCoordinates.length === 1) {
      // Solo una posición, zoom directo
      this.mapInstance.setView(routeCoordinates[0], 16);
    } else {

    }
  }

  /**
   * Zoom para mostrar todos los proveedores
   */
  private zoomToAllProviders(): void {
    if (!this.mapInstance || this.allProviders.length === 0) return;

    const providerCoordinates: [number, number][] = this.allProviders.map(provider => {
      const lat = provider.proveedorInfo?.latitud || provider.proveedorInfo?.lat || 10.501005998543437;
      const lng = provider.proveedorInfo?.longitud || provider.proveedorInfo?.lng || -84.6972559489806;
      return [lat, lng];
    });

    if (providerCoordinates.length === 1) {
      this.mapInstance.setView(providerCoordinates[0], 13);
    } else {
      const bounds = L.latLngBounds(providerCoordinates);
      this.mapInstance.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 14
      });
    }
  }
  // Limpiar todo
  clearAllRoutesEfficient(): void {
  if (this.mapLayers) {
    this.mapLayers.clearLayers();
  }
  if (this.currentUserMarker && this.mapInstance) {
    this.mapInstance.removeLayer(this.currentUserMarker);
    this.currentUserMarker = null;
  }
  // Limpiar también la polyline de navegación entre proveedores
  this.clearProviderNavigationRoute();
  this.routePolylines.clear();
}

// Método para limpiar la ruta más antigua
private clearOldestRoute(): void {
  if (this.routePolylines.size === 0) return;

  const oldestUserId = this.routePolylines.keys().next().value;
  if (typeof oldestUserId === 'string') {
    this.clearUserPolylines(oldestUserId);
  }
}

  /**
   * Marcar la posición actual del usuario
   */
  private markCurrentPosition(userId: string, currentPosition: RoutePoint): void {
    if (!this.mapInstance) return;

    // Crear marcador de posición actual
    const currentPositionMarker = L.circleMarker(currentPosition.position, {
      radius: 8,
      fillColor: '#FF5722',
      color: '#FFFFFF',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(this.mapInstance);

    // Tooltip con información
    currentPositionMarker.bindTooltip('Posición actual', {
      permanent: false,
      direction: 'top'
    });

    // Guardar marcador para limpieza
    if (!this.routePolylines.has(userId)) {
      this.routePolylines.set(userId, []);
    }
    // Convertir marker a polyline para el almacenamiento (workaround)
    this.routePolylines.get(userId)!.push(currentPositionMarker as any);
  }

  /**
   * Actualizar solo el marcador de posición actual sin redibujar toda la ruta
   */
  private updateCurrentPositionMarker(userId: string, newPosition: RoutePoint): void {
    if (!this.mapInstance) return;

    // Limpiar marcador anterior (solo el último elemento que debería ser el marcador)
    const userPolylines = this.routePolylines.get(userId);
    if (userPolylines && userPolylines.length > 0) {
      const lastElement = userPolylines[userPolylines.length - 1];
      // Si es un marcador circular (CircleMarker), lo removemos
      if (lastElement instanceof L.CircleMarker) {
        this.mapInstance.removeLayer(lastElement);
        userPolylines.pop();
      }
    }

    // Crear nuevo marcador de posición actual
    this.markCurrentPosition(userId, newPosition);
  }

  /**
   * Limpiar polylines de un usuario específico
   */
  private clearUserPolylines(userId: string): void {
      if (!this.mapLayers) return;

  const userPolylines = this.routePolylines.get(userId);
  if (userPolylines) {
    userPolylines.forEach(polyline => {
      this.mapLayers.removeLayer(polyline);
    });
    this.routePolylines.delete(userId);
  }
  }


  /**
   * Obtiene la ruta completa de un usuario
   */
  getUserRoute(userId: string): UserRoute | undefined {
    return this.activeRoutes.get(userId);
  }

  /**
   * Obtiene todas las rutas activas
   */
  getActiveRoutes(): UserRoute[] {
    return Array.from(this.activeRoutes.values()).filter(route => route.isActive);
  }

  /**
   * Obtiene el último segmento de ruta de un usuario
   */
  getLastSegment(userId: string): RouteSegment | null {
    const userRoute = this.activeRoutes.get(userId);
    if (!userRoute || userRoute.segments.length === 0) {
      return null;
    }
    return userRoute.segments[userRoute.segments.length - 1];
  }

  /**
   * Calcula la ruta completa desde el inicio hasta la posición actual
   */
  getCompleteRoute(userId: string): [number, number][] {
    const userRoute = this.activeRoutes.get(userId);
    if (!userRoute) {
      return [];
    }

    const allCoordinates: [number, number][] = [];

    // Agregar punto inicial si existe
    if (userRoute.segments.length > 0) {
      allCoordinates.push(userRoute.segments[0].startPoint.position);
    }

    // Agregar todas las coordenadas de los segmentos
    userRoute.segments.forEach(segment => {
      allCoordinates.push(...segment.coordinates);
    });

    // Agregar posición actual si es diferente al último punto
    const lastPoint = allCoordinates[allCoordinates.length - 1];
    const currentPos = userRoute.currentPosition.position;
    if (!lastPoint || (lastPoint[0] !== currentPos[0] || lastPoint[1] !== currentPos[1])) {
      allCoordinates.push(currentPos);
    }

    return allCoordinates;
  }

  /**
   * Limpia rutas antiguas
   */
  clearOldRoutes(): void {
    const now = new Date();
    const maxAge = this.config.maxRouteAge * 60 * 60 * 1000; // convertir horas a milisegundos

    for (const [userId, route] of this.activeRoutes.entries()) {
      const routeAge = now.getTime() - route.startTime.getTime();
      if (routeAge > maxAge && !route.isActive) {
        this.activeRoutes.delete(userId);
      }
    }

    this.notifyRouteUpdate();
  }

  /**
   * Configura opciones de rastreo
   */
  updateConfig(newConfig: Partial<RouteTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Redibuja todas las rutas activas en el mapa
   */
  redrawAllRoutes(): void {
    if (!this.mapInstance) return;

    for (const [userId, route] of this.activeRoutes.entries()) {
      if (route.isActive) {
        this.drawRoutePolylineAndZoom(userId);
      }
    }
  }

  /**
   * Limpiar todas las rutas del mapa
   */
  clearAllRoutes(): void {
    if (!this.mapInstance) return;

    for (const userId of this.routePolylines.keys()) {
      this.clearUserPolylines(userId);
    }
  }

  /**
   * Destruye el servicio y limpia recursos
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activeRoutes.clear();
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
      // Calcular ruta usando OSRM
      const routeData = await this.calculateOSRMRoute([fromCoords, toCoords]);

      if (routeData.code === 'Ok' && routeData.routes?.length > 0) {
        const route = routeData.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) =>
          [coord[1], coord[0]] as [number, number]
        );

        // Crear polyline con opciones personalizables
        const polylineOptions = {
          color: options?.routeColor || '#FF5722',
          weight: options?.routeWeight || 4,
          opacity: options?.routeOpacity || 0.8,
          lineJoin: 'round' as const,
          lineCap: 'round' as const
        };

        this.providerNavigationPolyline = L.polyline(coordinates, polylineOptions)
          .addTo(this.mapInstance);

        // Ajustar zoom solo si no se especifica lo contrario
        if (!options?.skipZoomAdjustment) {
          this.fitBoundsToProviders([fromProvider, toProvider]);
        }

      } else {
        // Si OSRM falla, dibujar línea directa
        console.warn('OSRM route failed, drawing direct line');
        this.drawDirectProviderLine(fromCoords, toCoords, options);
      }
    } catch (error) {
      console.error('Error calculating provider navigation route:', error);
      // Fallback a línea directa
      this.drawDirectProviderLine(fromCoords, toCoords, options);
    }
  }  /**
   * Dibuja una línea directa entre dos proveedores (fallback)
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

    const polylineOptions = {
      color: options?.routeColor || '#FF5722',
      weight: options?.routeWeight || 4,
      opacity: options?.routeOpacity || 0.6,
      dashArray: '10, 10',
      lineJoin: 'round' as const,
      lineCap: 'round' as const
    };

    this.providerNavigationPolyline = L.polyline([fromCoords, toCoords], polylineOptions)
      .addTo(this.mapInstance);

    // Ajustar zoom solo si no se especifica lo contrario
    if (!options?.skipZoomAdjustment) {
      const bounds = L.latLngBounds([fromCoords, toCoords]);
      this.mapInstance.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });
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
    // Intentar múltiples formas de obtener coordenadas
    let lat: number, lng: number;

    if (provider.proveedorInfo) {
      lat = provider.proveedorInfo.latitud || provider.proveedorInfo.lat;
      lng = provider.proveedorInfo.longitud || provider.proveedorInfo.lng;
    } else {
      // Buscar en nested objects como hace ProveedorMapService
      const info = Object.values(provider).find(
        (v) => v && typeof v === 'object' && 'coordenadaX' in v && 'coordenadaY' in v
      ) as { coordenadaX: string; coordenadaY: string } | undefined;

      if (info) {
        lat = parseFloat(info.coordenadaX);
        lng = parseFloat(info.coordenadaY);
      } else {
        console.warn('Could not extract coordinates from provider:', provider);
        return null;
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coordinates for provider:', provider);
      return null;
    }

    return [lat, lng];
  }

  /**
   * Ajusta el zoom para mostrar múltiples proveedores
   */
  private fitBoundsToProviders(providers: any[]): void {
    if (!this.mapInstance || providers.length === 0) return;

    const coordinates = providers
      .map(provider => this.getProviderCoordinates(provider))
      .filter(coords => coords !== null) as [number, number][];

    if (coordinates.length === 0) return;

    if (coordinates.length === 1) {
      // Solo un punto, hacer flyTo
      this.mapInstance.flyTo(coordinates[0], 15);
    } else {
      // Múltiples puntos, fitBounds
      const bounds = L.latLngBounds(coordinates);
      this.mapInstance.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16
      });
    }
  }

  // Métodos privados

  private async createRouteSegment(
    startPoint: RoutePoint,
    endPoint: RoutePoint,
    segmentIndex: number
  ): Promise<RouteSegment> {
    const segmentId = `segment_${Date.now()}_${segmentIndex}`;

    // Intentar calcular ruta usando OSRM
    let coordinates: [number, number][] = [];
    try {
      const routeData = await this.calculateOSRMRoute([
        startPoint.position,
        endPoint.position
      ]);

      if (routeData.code === 'Ok' && routeData.routes?.length > 0) {
        coordinates = routeData.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
      }
    } catch (error) {
      console.warn('Error calculando ruta OSRM, usando línea recta:', error);
    }

    // Si no se pudo calcular ruta, usar línea recta
    if (coordinates.length === 0) {
      coordinates = [startPoint.position, endPoint.position];
    }

    const distance = this.calculateDistance(startPoint.position, endPoint.position);
    const duration = endPoint.timestamp.getTime() - startPoint.timestamp.getTime();

    return {
      id: segmentId,
      startPoint,
      endPoint,
      coordinates,
      distance,
      duration,
      color: '#4285F4',
      weight: 4,
      opacity: 0.7
    };
  }

  private async calculateOSRMRoute(coordinates: [number, number][]): Promise<any> {
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

  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = point1[0] * Math.PI / 180;
    const φ2 = point2[0] * Math.PI / 180;
    const Δφ = (point2[0] - point1[0]) * Math.PI / 180;
    const Δλ = (point2[1] - point1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
  }

  private notifyRouteUpdate(): void {
    this.routeUpdatesSubject.next(new Map(this.activeRoutes));
  }

  private startPeriodicCleanup(): void {
    if (this.config.autoCleanupOldRoutes) {
      interval(60000) // cada minuto
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.clearOldRoutes();
        });
    }
  }



private updateCurrentPositionMarkerEfficient(userId: string, currentPosition: RoutePoint): void {
  if (!this.mapInstance) return;

  // Reutilizar marcador existente en lugar de crear nuevo
  if (this.currentUserMarker) {
    this.currentUserMarker.setLatLng(currentPosition.position);
  } else {
      this.currentUserMarker = L.circleMarker(currentPosition.position, {
      radius: 6, // Reducido de 8 a 6
      fillColor: '#FF5722',
      color: '#FFFFFF',
      weight: 1, // Reducido de 2 a 1
      opacity: 1,
      fillOpacity: 0.8
    });

    if (this.mapLayers) {
      this.currentUserMarker.addTo(this.mapLayers);
    } else {
      this.currentUserMarker.addTo(this.mapInstance);
    }

    this.currentUserMarker.bindTooltip('Posición actual', {
      permanent: false,
      direction: 'top'
    });
  }
}
}
