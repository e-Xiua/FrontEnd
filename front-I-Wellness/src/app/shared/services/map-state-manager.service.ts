import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouteDisplayOptions, UserRoute } from '../models/route-tracking';
import { usuarios } from '../models/usuarios';

export interface MapState {
  providers: usuarios[];
  activeProviderIndex: number;
  previousProviderIndex: number;
  activeProvider: usuarios | null;
  previousProvider: usuarios | null;
  showCarousel: boolean;
  showProviderCard: boolean;
  showRoutes: boolean;
  userRoutes: UserRoute[];
  routeDisplayOptions: RouteDisplayOptions;
  mapCenter: [number, number];
  mapZoom: number;
}

export interface MapDisplayData {
  providers: usuarios[];
  activeProviderIndex: number;
  activeProviderName: string;
  showCarousel: boolean;
  showProviderCard: boolean;
  providerItems: any[];
  userRoutes: UserRoute[];
  routeDisplayOptions: RouteDisplayOptions;
}

@Injectable({
  providedIn: 'root'
})
export class MapStateManager {
  private initialState: MapState = {
    providers: [],
    activeProviderIndex: -1,
    previousProviderIndex: -1,
    activeProvider: null,
    previousProvider: null,
    showCarousel: true,
    showProviderCard: true,
    showRoutes: true,
    userRoutes: [],
    routeDisplayOptions: {
      showCurrentRoute: true,
      showHistoricalRoutes: false,
      routeColor: '#4285F4',
      routeWeight: 6,
      routeOpacity: 0.8,
      showStartMarker: true,
      showEndMarker: true,
      showCurrentPositionMarker: true
    },
    mapCenter: [10.501005998543437, -84.6972559489806],
    mapZoom: 13
  };

  private stateSubject = new BehaviorSubject<MapState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  // Observables específicos para partes del estado
  public providers$ = this.state$.pipe(map(state => state.providers));
  public activeProvider$ = this.state$.pipe(map(state => state.activeProvider));
  public previousProvider$ = this.state$.pipe(map(state => state.previousProvider));
  public activeProviderIndex$ = this.state$.pipe(map(state => state.activeProviderIndex));
  public previousProviderIndex$ = this.state$.pipe(map(state => state.previousProviderIndex));
  public userRoutes$ = this.state$.pipe(map(state => state.userRoutes));
  public routeDisplayOptions$ = this.state$.pipe(map(state => state.routeDisplayOptions));

  // Observable combinado para datos de visualización
  public displayData$: Observable<MapDisplayData> = combineLatest([
    this.providers$,
    this.activeProviderIndex$,
    this.activeProvider$,
    this.state$.pipe(map(state => state.showCarousel)),
    this.state$.pipe(map(state => state.showProviderCard)),
    this.userRoutes$,
    this.routeDisplayOptions$
  ]).pipe(
    map(([providers, activeIndex, activeProvider, showCarousel, showProviderCard, userRoutes, routeOptions]) => ({
      providers,
      activeProviderIndex: activeIndex,
      activeProviderName: this.getActiveProviderName(activeProvider, activeIndex),
      showCarousel,
      showProviderCard,
      providerItems: this.createProviderItems(providers),
      userRoutes,
      routeDisplayOptions: routeOptions
    }))
  );

  constructor() {}

  // Métodos para actualizar el estado
  setProviders(providers: usuarios[]): void {
    const currentState = this.stateSubject.value;
    const newActiveIndex = providers.length > 0 ? 0 : -1;
    const newActiveProvider = providers.length > 0 ? providers[0] : null;

    this.stateSubject.next({
      ...currentState,
      providers,
      activeProviderIndex: newActiveIndex,
      activeProvider: newActiveProvider,
      // Reset previous provider when setting new providers
      previousProviderIndex: -1,
      previousProvider: null
    });
  }

  setActiveProviderIndex(index: number): void {
    const currentState = this.stateSubject.value;
    if (index >= 0 && index < currentState.providers.length) {
      // Guardar el proveedor anterior
      const previousIndex = currentState.activeProviderIndex;
      const previousProvider = currentState.activeProvider;

      this.stateSubject.next({
        ...currentState,
        previousProviderIndex: previousIndex,
        previousProvider: previousProvider,
        activeProviderIndex: index,
        activeProvider: currentState.providers[index]
      });
    }
  }

  goToPreviousProvider(): boolean {
    const currentState = this.stateSubject.value;
    if (currentState.activeProviderIndex > 0) {
      this.setActiveProviderIndex(currentState.activeProviderIndex - 1);
      return true;
    }
    return false;
  }

  goToNextProvider(): boolean {
    const currentState = this.stateSubject.value;
    if (currentState.activeProviderIndex < currentState.providers.length - 1) {
      this.setActiveProviderIndex(currentState.activeProviderIndex + 1);
      return true;
    }
    return false;
  }

  updateDisplayOptions(options: Partial<{showCarousel: boolean, showProviderCard: boolean, showRoutes: boolean}>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      ...options
    });
  }

  updateRouteDisplayOptions(options: Partial<RouteDisplayOptions>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      routeDisplayOptions: {
        ...currentState.routeDisplayOptions,
        ...options
      }
    });
  }

  addUserRoute(route: UserRoute): void {
    const currentState = this.stateSubject.value;
    const existingRouteIndex = currentState.userRoutes.findIndex(r => r.userId === route.userId);

    let updatedRoutes: UserRoute[];
    if (existingRouteIndex >= 0) {
      updatedRoutes = [...currentState.userRoutes];
      updatedRoutes[existingRouteIndex] = route;
    } else {
      updatedRoutes = [...currentState.userRoutes, route];
    }

    this.stateSubject.next({
      ...currentState,
      userRoutes: updatedRoutes
    });
  }

  removeUserRoute(userId: string): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      userRoutes: currentState.userRoutes.filter(route => route.userId !== userId)
    });
  }

  updateMapPosition(center: [number, number], zoom?: number): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      mapCenter: center,
      mapZoom: zoom || currentState.mapZoom
    });
  }

  // Métodos de acceso al estado actual
  getCurrentState(): MapState {
    return this.stateSubject.value;
  }

  getCurrentActiveProvider(): usuarios | null {
    return this.stateSubject.value.activeProvider;
  }

  getCurrentProviders(): usuarios[] {
    return this.stateSubject.value.providers;
  }

  // Métodos auxiliares privados
  private getActiveProviderName(provider: usuarios | null, index: number): string {
    if (provider) {
      // Buscar nombre de empresa en proveedorInfo o usar nombre del usuario
      const nombreEmpresa = provider.proveedorInfo?.nombre_empresa ||
                           provider.proveedorInfo?.empresa ||
                           provider.nombre;
      return nombreEmpresa || `Proveedor ${index + 1}`;
    }
    return 'Seleccionar proveedor';
  }

  private createProviderItems(providers: usuarios[]): any[] {
    return providers.map((provider, index) => ({
      id: provider.id,
      position: this.getProviderPosition(provider),
      data: provider,
      index
    }));
  }

  private getProviderPosition(provider: usuarios): [number, number] {
    // Intentar obtener coordenadas desde proveedorInfo
    const latitud = provider.proveedorInfo?.latitud || provider.proveedorInfo?.lat;
    const longitud = provider.proveedorInfo?.longitud || provider.proveedorInfo?.lng;

    // Coordenadas por defecto (Costa Rica) si no se encuentran
    return [latitud || 10.501005998543437, longitud || -84.6972559489806];
  }

  // Método para resetear el estado
  reset(): void {
    this.stateSubject.next(this.initialState);
  }
}
