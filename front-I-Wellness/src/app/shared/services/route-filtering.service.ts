import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Route } from '../models/route';


export interface RouteFilter {
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  minDuration?: number;
  maxDuration?: number;
  tags?: string[];
  searchText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RouteFilteringService {
  private routesSubject = new BehaviorSubject<Route[]>([]);
  private filtersSubject = new BehaviorSubject<RouteFilter>({});

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
      if (filters.difficulty && route.difficulty !== filters.difficulty) {
        return false;
      }
      if (filters.minDuration && route.estimatedTime && route.estimatedTime < filters.minDuration) {
        return false;
      }
      if (filters.maxDuration && route.estimatedTime && route.estimatedTime > filters.maxDuration) {
        return false;
      }
      if (filters.searchText) {
        const searchText = filters.searchText.toLowerCase();
        const matchesName = route.name.toLowerCase().includes(searchText);
        const matchesDescription = route.description?.toLowerCase().includes(searchText);
        const matchesTags = route.tags?.some(tag => tag.toLowerCase().includes(searchText));
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false;
        }
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag =>
          route.tags?.includes(filterTag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      return true;
    });
  }
}
