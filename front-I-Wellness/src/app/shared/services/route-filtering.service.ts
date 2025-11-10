import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Route } from '../models/route';


export interface RouteFilter {
  category?: string;
  minDuration?: number;
  maxDuration?: number;
  tags?: string[];
  searchText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RouteFilteringService {
  private readonly routesSubject = new BehaviorSubject<Route[]>([]);
  private readonly filtersSubject = new BehaviorSubject<RouteFilter>({});

  public routes$: Observable<Route[]> = this.routesSubject.asObservable();
  public filters$: Observable<RouteFilter> = this.filtersSubject.asObservable();

  public filteredRoutes$: Observable<Route[]>;

  constructor() {
    this.filteredRoutes$ = combineLatest([this.routes$, this.filters$]).pipe(
      map(([routes, filters]) => this.applyFilters(routes, filters))
    );
  }

  public setRoutes(routes: Route[]): void {
    this.routesSubject.next(routes);
  }

  public updateFilters(newFilters: Partial<RouteFilter>): void {
    const currentFilters = this.filtersSubject.getValue();
    this.filtersSubject.next({ ...currentFilters, ...newFilters });
  }

  public clearFilters(): void {
    this.filtersSubject.next({});
  }

  private applyFilters(routes: Route[], filters: RouteFilter): Route[] {
    return routes.filter(route => {
      if (filters.category && route.category !== filters.category) {
        return false;
      }
      if (filters.minDuration !== undefined && filters.minDuration !== null && route.estimatedTime !== undefined && route.estimatedTime < filters.minDuration) {
        return false;
      }
      if (filters.maxDuration !== undefined && filters.maxDuration !== null && route.estimatedTime !== undefined && route.estimatedTime > filters.maxDuration) {
        return false;
      }
      if (filters.searchText && filters.searchText.trim().length > 0) {
        if (!this.matchesSearchText(route, filters.searchText)) {
          return false;
        }
      }
      if (filters.tags && filters.tags.length > 0) {
        if (!this.hasMatchingTags(route, filters.tags)) {
          return false;
        }
      }
      return true;
    });
  }

  private matchesSearchText(route: Route, rawSearch: string): boolean {
    const searchText = rawSearch.toLowerCase();
    if (route.name.toLowerCase().includes(searchText)) {
      return true;
    }

    if (route.description?.toLowerCase().includes(searchText)) {
      return true;
    }

    if (route.tags && this.containsText(route.tags, searchText)) {
      return true;
    }

    if (route.providerCategories && this.containsText(route.providerCategories, searchText)) {
      return true;
    }

    for (const provider of route.providers ?? []) {
      if (provider.nombre?.toLowerCase().includes(searchText)) {
        return true;
      }

      const categories = provider.proveedorInfo?.categories ?? [];
      if (this.containsText(categories, searchText)) {
        return true;
      }
    }

    return false;
  }

  private hasMatchingTags(route: Route, tags: string[]): boolean {
    for (const rawTag of tags) {
      const normalizedTag = rawTag.toLowerCase();

      if (route.tags && this.containsExact(route.tags, normalizedTag)) {
        return true;
      }

      if (route.providerCategories && this.containsExact(route.providerCategories, normalizedTag)) {
        return true;
      }

      for (const provider of route.providers ?? []) {
        const categories = provider.proveedorInfo?.categories ?? [];
        if (this.containsExact(categories, normalizedTag)) {
          return true;
        }
      }
    }
    return false;
  }

  private containsText(values: string[], text: string): boolean {
    for (const value of values) {
      if (value?.toLowerCase().includes(text)) {
        return true;
      }
    }
    return false;
  }

  private containsExact(values: string[], normalized: string): boolean {
    for (const value of values) {
      if (value?.toLowerCase() === normalized) {
        return true;
      }
    }
    return false;
  }
}
