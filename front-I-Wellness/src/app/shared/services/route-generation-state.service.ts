import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

import { Route, RouteSelectionEvent } from '../models/route';
import { usuarios } from '../models/usuarios';
import { RouteBuilderStateService } from './route-builder-state.service';
import { RouteOptimizationService } from './route-optimization.service';

import {
  enrichOptimizationResult as enrichOptimizationResultAdapter,
  mapOptimizationResultToRoute
} from '../adapters/optimization-result.adapter';
import { normalizeEnrichedProvider } from '../adapters/provider-data.adapter';
import { OptimizationResult } from '../models/optimization-job.models';
import { EnrichedProviderData } from '../models/provider.models';

@Injectable({ providedIn: 'root' })
export class RouteGenerationStateService {
  private readonly _routes$ = new BehaviorSubject<Route[]>([]);
  private readonly _isLoading$ = new BehaviorSubject<boolean>(false);
  private readonly _error$ = new BehaviorSubject<string | null>(null);
  private readonly _activeRouteId$ = new BehaviorSubject<string | null>(null);
  private readonly _activeProvider$ = new BehaviorSubject<usuarios | null>(null);
  private readonly providerCache = new Map<number, EnrichedProviderData>();
  private lastRequestedUserId?: string;

  readonly routes$: Observable<Route[]> = this._routes$.asObservable();
  readonly isLoading$: Observable<boolean> = this._isLoading$.asObservable();
  readonly error$: Observable<string | null> = this._error$.asObservable();
  readonly activeRoute$: Observable<Route | null> = combineLatest([
    this._routes$.asObservable(),
    this._activeRouteId$.asObservable()
  ]).pipe(
    map(([routes, activeId]) => routes.find(route => route.id === activeId) ?? null)
  );
  readonly activeProvider$: Observable<usuarios | null> = this._activeProvider$.asObservable();

  constructor(
    private readonly routeOptimizationService: RouteOptimizationService,
    private readonly routeBuilderState: RouteBuilderStateService

  ) {
    this.seedProviderCache(this.routeBuilderState.getCachedProviders());
    this.routeBuilderState.providers$.subscribe(providers => this.seedProviderCache(providers));
  }

  loadCompletedRoutes(userId?: string | number): void {
    const formattedUserId = userId !== undefined && userId !== null ? String(userId) : undefined;
    this.lastRequestedUserId = formattedUserId;

    this._isLoading$.next(true);
    this._error$.next(null);

    const fetch$ = formattedUserId
      ? this.routeOptimizationService.getCompletedRoutesByUser(formattedUserId)
      : this.routeOptimizationService.getCompletedRoutes();

    fetch$
      .pipe(
        map((results: OptimizationResult[] | null | undefined) => results ?? []),
        switchMap(results =>
          this.enrichResults(results).pipe(
            map((enrichedResults: OptimizationResult[]) =>
              enrichedResults.map((result: OptimizationResult) => mapOptimizationResultToRoute(result))
            )
          )
        ),
        catchError(error => {
          console.error('Error loading completed routes', error);
          this._error$.next('No se pudieron cargar las rutas completadas.');
          return of<Route[]>([]);
        }),
        finalize(() => this._isLoading$.next(false))
      )
      .subscribe(routes => {
        this._routes$.next(routes);
        if (routes.length > 0) {
          this.setActiveRoute(routes[0].id);
        } else {
          this.setActiveRoute(null);
        }
      });
  }

  refreshRoutes(): void {
    this.loadCompletedRoutes(this.lastRequestedUserId);
  }

  handleRouteSelected(event: RouteSelectionEvent): void {
    this.setActiveRoute(event.route.id);
    if (event.selectedProvider) {
      this.setActiveProvider(event.selectedProvider);
    }
  }

  handleProviderSelected(route: Route, provider: usuarios): void {
    this.setActiveRoute(route.id);
    this.setActiveProvider(provider);
  }

  setActiveRoute(routeId: string | null): void {
    this._activeRouteId$.next(routeId);
    if (!routeId) {
      this._activeProvider$.next(null);
      return;
    }

    const route = this._routes$.value.find(r => r.id === routeId);
    if (route && route.providers.length > 0) {
      this._activeProvider$.next(route.providers[0]);
    } else {
      this._activeProvider$.next(null);
    }
  }

  setActiveProvider(provider: usuarios | null): void {
    this._activeProvider$.next(provider);
  }

  private seedProviderCache(providers: EnrichedProviderData[]): void {
    if (!providers || providers.length === 0) {
      return;
    }

    for (const provider of providers) {
      if (provider?.provider?.id) {
        this.providerCache.set(provider.provider.id, provider);
      }
    }
  }

  private enrichResults(results: OptimizationResult[]): Observable<OptimizationResult[]> {
    if (!results || results.length === 0) {
      return of([]);
    }

    const providerIds = new Set<number>();
    for (const result of results) {
      for (const poi of result.optimizedSequence) {
        const id = Number(poi.poiId);
        if (!Number.isNaN(id)) {
          providerIds.add(id);
        }
      }
    }

    const missingProviderIds = Array.from(providerIds).filter(id => !this.providerCache.has(id));

    if (missingProviderIds.length === 0) {
      return of(this.applyEnrichment(results));
    }

    const enrichmentRequests = missingProviderIds.map(id =>
      this.routeOptimizationService.enrichProvidersData(id).pipe(
        map(response => normalizeEnrichedProvider(response)),
        catchError(error => {
          console.error(`No se pudo enriquecer el proveedor ${id}`, error);
          return of<EnrichedProviderData | null>(null);
        })
      )
    );

    return forkJoin(enrichmentRequests).pipe(
      map(responses => {
        for (const enriched of responses) {
          if (enriched?.provider?.id) {
            this.providerCache.set(enriched.provider.id, enriched);
          }
        }
        return this.applyEnrichment(results);
      })
    );
  }

  private applyEnrichment(results: OptimizationResult[]): OptimizationResult[] {
    if (!results || results.length === 0) {
      return [];
    }

    const providers = Array.from(this.providerCache.values());
    return results.map(result => enrichOptimizationResultAdapter(result, providers));
  }

  clearState(): void {
    this._routes$.next([]);
    this._isLoading$.next(false);
    this._error$.next(null);
    this._activeRouteId$.next(null);
    this._activeProvider$.next(null);
  }
}
