import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Route } from '../models/route';

@Injectable({
  providedIn: 'root'
})
export class RouteDataService {
  private selectedRouteSubject = new BehaviorSubject<Route | null>(null);
  public selectedRoute$: Observable<Route | null> = this.selectedRouteSubject.asObservable();

  constructor() {}

  /**
   * Establecer la ruta seleccionada
   */
  setSelectedRoute(route: Route | null): void {
    console.log('RouteDataService: Setting selected route:', route?.name);
    this.selectedRouteSubject.next(route);
  }

  /**
   * Obtener la ruta seleccionada actual
   */
  getSelectedRoute(): Route | null {
    const currentRoute = this.selectedRouteSubject.value;
    console.log('RouteDataService: Getting selected route:', currentRoute?.name);
    return currentRoute;
  }

  /**
   * Limpiar la ruta seleccionada
   */
  clearSelectedRoute(): void {
    console.log('RouteDataService: Clearing selected route');
    this.selectedRouteSubject.next(null);
  }

  /**
   * Verificar si hay una ruta seleccionada
   */
  hasSelectedRoute(): boolean {
    return this.selectedRouteSubject.value !== null;
  }
}
