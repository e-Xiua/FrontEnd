/**
 * Route Builder State Service
 *
 * Centralized state management service for route building and optimization.
 * Uses RxJS BehaviorSubjects to provide reactive state updates to components.
 *
 * Responsibilities:
 * - Manage UI state for the route builder (selected POIs, active jobs, loading states)
 * - Coordinate between UsuarioService and RouteOptimizationService
 * - Provide reactive observables for components to subscribe to
 * - Handle business logic for route building workflow
 *
 * Delegates HTTP communication to:
 * - UsuarioService: For fetching provider data
 * - RouteOptimizationService: For job submission, status polling, and cancellation
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, interval, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, takeWhile, tap } from 'rxjs/operators';

// Services
import { UsuarioService } from '../../features/users/services/usuario.service';
import { RouteOptimizationService } from './route-optimization.service';

// Models
import { ServicioService } from '../../features/servicios/services/servicio.service';
import { enrichOptimizationResult as enrichOptimizationResultAdapter } from '../adapters/optimization-result.adapter';
import { buildFallbackEnrichedProvider, normalizeEnrichedProvider } from '../adapters/provider-data.adapter';
import {
  JobStatusResponse,
  OptimizationJob,
  OptimizationResult
} from '../models/optimization-job.models';
import { EnrichedProviderData } from '../models/provider.models';
import { RouteRow } from '../models/route-builder.models';
import { usuarios } from '../models/usuarios';

@Injectable({
  providedIn: 'root'
})
export class RouteBuilderStateService {

  // API endpoint (only for enriched provider data, which is not in usuario.service)
  private readonly baseUrl = 'http://localhost:8085/api/route-processing';

  // ========== PRIVATE STATE (BehaviorSubjects) ==========

  private _providers$ = new BehaviorSubject<EnrichedProviderData[]>([]);
  private _selectedPois$ = new BehaviorSubject<RouteRow[]>([
    { id: crypto.randomUUID(), providerId: null, selectedService: null, providerData: null }
  ]);
  private _activeJobs$ = new BehaviorSubject<OptimizationJob[]>([]);
  private _isLoading$ = new BehaviorSubject<boolean>(false);
  private _error$ = new BehaviorSubject<string | null>(null);

  // New state for map UI
  private _activeProviderId$ = new BehaviorSubject<number | null>(null);
  private _activeOptimizedPoiId$ = new BehaviorSubject<number | string | null>(null);
  private _selectedJobId$ = new BehaviorSubject<string | null>(null);


  // ========== PUBLIC OBSERVABLES (Read-only) ==========

  public readonly providers$ = this._providers$.asObservable();
  public readonly selectedPois$ = this._selectedPois$.asObservable();
  public readonly activeJobs$ = this._activeJobs$.asObservable();
  public readonly isLoading$ = this._isLoading$.asObservable();
  public readonly error$ = this._error$.asObservable();

  // New public observables for map UI
  public readonly activeProviderId$ = this._activeProviderId$.asObservable();
  public readonly activeOptimizedPoiId$ = this._activeOptimizedPoiId$.asObservable();
  public readonly selectedJobId$ = this._selectedJobId$.asObservable();

  // Computed observables
  public readonly completedJobs$: Observable<OptimizationJob[]> = this.activeJobs$.pipe(
    map(jobs => jobs.filter(job => job.status === 'COMPLETED'))
  );

  public readonly processingJobs$: Observable<OptimizationJob[]> = this.activeJobs$.pipe(
    map(jobs => jobs.filter(job => job.status === 'PROCESSING' || job.status === 'PENDING'))
  );

  public readonly selectedJobForDisplay$: Observable<OptimizationJob | null> = this.selectedJobId$.pipe(
    switchMap(jobId => this.completedJobs$.pipe(
      map(jobs => jobs.find(j => j.jobId === jobId) || null)
    ))
  );

  constructor(
    private http: HttpClient,
    private servicioService: ServicioService, // Kept for backward compatibility, no longer used in loadProviders
    private usuarioService: UsuarioService,
    private routeOptimizationService: RouteOptimizationService,

  ) {
    console.log('RouteBuilderStateService initialized - Using backend enrichment');
  }

  // ========== PUBLIC METHODS (Actions) ==========

  /**
   * Load all available providers and enrich with services data FROM BACKEND
   *
   * NEW FLOW (Backend-Driven Enrichment):
   * 1. Fetch all providers from UsuarioService
   * 2. For each provider, call backend enrichment endpoint
   * 3. Backend returns complete EnrichedProviderData with:
   *    - Provider info
   *    - All services
   *    - Average cost (calculated by backend)
   *    - Average duration (calculated by backend)
   *    - Categories
   *
   * OLD FLOW (Deprecated):
   * 1. Fetch all providers from UsuarioService
   * 2. For each provider, fetch their services from providers API
   * 3. Transform to EnrichedProviderData using adapter (frontend calculates averages)
   * 2. For each provider, fetch their services from providers API
   * 3. Transform to EnrichedProviderData using adapter
   */
  loadProviders(): void {
    this._isLoading$.next(true);
    this._error$.next(null);

    console.log('Loading all providers via UsuarioService');

    this.usuarioService.obtenerProveedores()
      .pipe(
        switchMap((providers: usuarios[]) => {
          console.log(`Fetched ${providers.length} providers, now fetching enriched data from backend for each...`);

          if (providers.length === 0) {
            return of([]);
          }

          // 🔄 NEW APPROACH: Fetch enriched data from backend for each provider
          // This replaces the previous approach of fetching services separately and calculating averages on frontend
          const enrichmentRequests = providers.map(provider =>
            this.routeOptimizationService.enrichProvidersData(provider.id).pipe(
              map(enrichedData => {
                console.log(`Received enriched data for provider ${provider.id} from backend`, enrichedData);
                // Normalize backend payload into our strict EnrichedProviderData shape
                return normalizeEnrichedProvider(enrichedData as any);
              }),
              catchError(error => {
                console.error(`Error enriching data for provider ${provider.id}:`, error);
                // On error, create a normalized fallback object so the entire process doesn't fail
                return of(buildFallbackEnrichedProvider(provider as any));
              })
            )
          );

          // Wait for all enrichment requests to complete
          return forkJoin(enrichmentRequests);
        }),
        catchError(error => {
          console.error('Error loading and enriching providers:', error);
          this._error$.next('Failed to load providers. Please try again.');
          return throwError(() => error);
        }),
        finalize(() => {
          this._isLoading$.next(false);
        })
      )
      .subscribe((enrichedProviders: EnrichedProviderData[]) => {
        this._providers$.next(enrichedProviders);
        console.log('Providers loaded successfully:', enrichedProviders.length);

        // 📊 LOGGING: Sample enriched provider data from backend
        if (enrichedProviders.length > 0) {
          console.log('=== 📊 ENRICHED PROVIDER DATA FROM BACKEND ===');
          console.log(JSON.stringify(enrichedProviders[0], null, 2));
          console.log('Provider details:', {
            id: enrichedProviders[0].provider.id,
            correo: enrichedProviders[0].provider.correo,
            name: enrichedProviders[0].provider.nombre_empresa,
            coordinates: [enrichedProviders[0].provider.coordenadaX, enrichedProviders[0].provider.coordenadaY],
            servicesCount: enrichedProviders[0].services.length,
            averageCost: enrichedProviders[0].averageCost,
            averageDuration: enrichedProviders[0].averageVisitDuration,
            categories: enrichedProviders[0].categories,
            source: 'BACKEND (not frontend calculated)'
          });
          console.log('===============================================');
        }
      });
  }

  /**
   * Create fallback enriched data when backend call fails
   *
   * This function is defensive: `provider` can be either an already-enriched
   * object (with `.provider`) or a raw provider object returned by
   * `usuarioService` (which may have fields like `idProveedor`,
   * `proveedorInfo`, and string coordinates). We normalize and parse coordinates
   * to numbers here so the rest of the app can rely on numeric lat/lng.
   */
  private createFallbackEnrichedData(provider: any): EnrichedProviderData {
    // Kept for backward compatibility – now delegates to centralized adapter
    return buildFallbackEnrichedProvider(provider);
  }
  /**
   * Add a new empty row to the route builder
   */
  addPoiToRoute(): void {
    const currentRows = this._selectedPois$.value;
    const newRow: RouteRow = {
      id: crypto.randomUUID(),
      providerId: null,
      selectedService: null,
      providerData: null
    };

    this._selectedPois$.next([...currentRows, newRow]);
    console.log('Added new POI row:', newRow.id);
  }

  /**
   * Remove a row from the route builder
   */
  removePoiFromRoute(rowId: string): void {
    const currentRows = this._selectedPois$.value;

    // Don't allow removing the last row
    if (currentRows.length <= 1) {
      console.warn('Cannot remove last row');
      return;
    }

    const updatedRows = currentRows.filter(row => row.id !== rowId);
    this._selectedPois$.next(updatedRows);
    console.log('Removed POI row:', rowId);
  }

  /**
   * Update a row with selected provider data
   */
  updateRowProvider(rowId: string, providerId: number): void {
    const currentRows = this._selectedPois$.value;
    const providerData = this._providers$.value.find(p => p.provider.id === providerId);

    if (!providerData) {
      console.error('Provider not found:', providerId);
      return;
    }

    // 🔍 LOGGING: Enriched provider data when user selects a provider
    console.log('=== 🔍 PROVIDER SELECTED IN ROUTE BUILDER ===');
    console.log('Row ID:', rowId);
    console.log('Provider ID:', providerId);

    // Log full enriched data as JSON for complete inspection
    console.log('Full EnrichedProviderData (JSON):');
    console.log(JSON.stringify(providerData, null, 2));

    // Log structured summary for easy reading
    console.log('Provider Summary:', {
      id: providerData.provider.id,
      name: providerData.provider.nombre_empresa,
      coordinates: {
        latitude: providerData.provider.coordenadaX,
        longitude: providerData.provider.coordenadaY
      },
      servicesCount: providerData.services.length,
      averageCost: providerData.averageCost,
      averageVisitDuration: providerData.averageVisitDuration,
      categories: providerData.categories
    });

    // Log all available services with their details
    console.log('Available Services for this Provider:');
    providerData.services.forEach((service, index) => {
      console.log(`  ${index + 1}. ${service.nombre}`, {
        id: service.idServicio,
        precio: service.precio,
        tiempoAproximado: service.tiempoAproximado,
        descripcion: service.descripcion
      });
    });

    console.log('=============================================');

    const updatedRows = currentRows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          providerId,
          providerData,
          selectedService: null // Reset service when provider changes
        };
      }
      return row;
    });

    this._selectedPois$.next(updatedRows);
    console.log('Updated row provider:', rowId, providerId);
  }

  /**
   * Update a row with selected service
   */
  updateRowService(rowId: string, serviceId: number): void {
    const currentRows = this._selectedPois$.value;

    const updatedRows = currentRows.map(row => {
      if (row.id === rowId && row.providerData) {
        const service = row.providerData.services.find((s: any) => s.idServicio === serviceId);

        // 🎯 LOGGING: Specific service selected by user
        if (service) {
          console.log('=== 🎯 SERVICE SELECTED IN ROUTE BUILDER ===');
          console.log('Row ID:', rowId);
          console.log('Service ID:', serviceId);
          console.log('Provider:', row.providerData.provider.nombre_empresa);

          // Log full service object as JSON
          console.log('Full Service Object (JSON):');
          console.log(JSON.stringify(service, null, 2));

          // Log structured service details
          console.log('Selected Service Details:', {
            id: service.idServicio,
            nombre: service.nombre,
            descripcion: service.descripcion,
            precio: service.precio,
            tiempoAproximado: service.tiempoAproximado
          });

          // Show comparison with provider averages
          console.log('Comparison with Provider Averages:', {
            serviceCost: service.precio,
            providerAvgCost: row.providerData.averageCost,
            costDifference: service.precio - row.providerData.averageCost,
            serviceDuration: service.tiempoAproximado,
            providerAvgDuration: row.providerData.averageVisitDuration,
            durationDifference: service.tiempoAproximado - row.providerData.averageVisitDuration
          });

          console.log('============================================');
        } else {
          console.warn(`Service with ID ${serviceId} not found in provider's services`);
        }

        return {
          ...row,
          selectedService: service || null
        };
      }
      return row;
    });

    this._selectedPois$.next(updatedRows);
  }

  /**
   * Start route optimization
   * Submits the job and starts polling for status
   * Uses RouteOptimizationService for job submission
   *
   * NOW SUPPORTS:
   * - Rows with specific service selected (uses service cost/duration)
   * - Rows with only provider selected (uses backend-calculated averages)
   */
  startOptimization(userId: number, optimizeFor: 'distance' | 'cost' | 'time' = 'distance'): void {
    // Include rows with provider selected (service is now optional)
    const selectedRows = this._selectedPois$.value.filter(row =>
      row.providerId && row.providerData
    );

    if (selectedRows.length < 2) {
      this._error$.next('Please select at least 2 providers to optimize the route');
      return;
    }

    this._isLoading$.next(true);
    this._error$.next(null);

    // Build optimization request with required fields: userId, providerIds, optimizeFor
    const providerIds = selectedRows
      .map(row => row.providerId!)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

    const request = {
      userId: userId,
      providerIds: providerIds,
      optimizeFor: optimizeFor
    };

    // 📤 LOGGING: Complete optimization request payload before sending to backend
    console.log('=== 📤 OPTIMIZATION REQUEST PAYLOAD ===');
    console.log(JSON.stringify(request, null, 2));
    console.log('Request summary:', {
      userId: userId,
      providersCount: providerIds.length,
      providerIds: providerIds,
      optimizationCriteria: optimizeFor,
      timestamp: new Date().toISOString()
    });
    console.log('Selected rows details:', selectedRows.map(row => ({
      rowId: row.id,
      providerId: row.providerId,
      providerName: row.providerData?.provider.nombre_empresa,
      dataSource: row.selectedService ? 'SPECIFIC_SERVICE' : 'PROVIDER_AVERAGES',
      serviceName: row.selectedService?.nombre || 'N/A (using averages)',
      cost: row.selectedService?.precio || row.providerData?.averageCost,
      duration: row.selectedService?.tiempoAproximado || row.providerData?.averageVisitDuration,
      categories: row.providerData?.categories
    })));
    console.log('========================================');

    // Submit job using RouteOptimizationService
    // Note: RouteOptimizationService uses snake_case in its response
    this.routeOptimizationService.submitOptimizationRequest(request)
      .pipe(
        catchError(error => {
          console.error('Error submitting optimization job:', error);
          this._error$.next('Failed to submit optimization job. Please try again.');
          this._isLoading$.next(false);
          return throwError(() => error);
        })
      )
      .subscribe((response: any) => {
        console.log('Job submitted successfully:', response);

        // Create job tracking object (convert snake_case to camelCase)
        const job: OptimizationJob = {
          jobId: response.job_id || response.jobId,
          routeName: `Route ${new Date().toLocaleTimeString()}`,
          status: 'PENDING',
          progress: 0,
          message: response.message,
          result: null,
          error: null,
          submittedAt: new Date(),
          estimatedCompletionTime: (response.estimated_completion_time || response.estimatedCompletionTime) ?
            new Date(response.estimated_completion_time || response.estimatedCompletionTime) : undefined
        };

        // Add to active jobs
        const currentJobs = this._activeJobs$.value;
        this._activeJobs$.next([...currentJobs, job]);

        // Start polling
        this.pollJobStatus(response.job_id || response.jobId);

        this._isLoading$.next(false);
      });
  }

  /**
   * Poll for job status updates
   * Checks every 5 seconds until job is complete, failed, or cancelled
   * Uses RouteOptimizationService for status polling
   */
  private pollJobStatus(jobId: string): void {
    console.log('Starting polling for job:', jobId);

    interval(5000) // Poll every 5 seconds
      .pipe(
        switchMap(() => this.routeOptimizationService.getJobStatus(jobId)),
        tap((status: any) => {
          // Convert snake_case to camelCase
          const normalizedStatus: JobStatusResponse = {
            jobId: status.job_id || status.jobId,
            status: status.status,
            message: status.message,
            progressPercentage: status.progress_percentage ?? status.progressPercentage ?? 0,
            createdAt: status.created_at || status.createdAt,
            updatedAt: status.updated_at || status.updatedAt,
            completedAt: status.completed_at || status.completedAt,
            estimatedCompletionTime: status.estimated_completion_time || status.estimatedCompletionTime,
            retryAfterSeconds: status.retry_after_seconds || status.retryAfterSeconds,
            result: status.result,
            error: status.error
          };

          console.log(`Job ${jobId} status:`, normalizedStatus.status, `${normalizedStatus.progressPercentage}%`);
          this.updateJobInState(jobId, normalizedStatus);
        }),
        takeWhile((status: any) =>
          status.status === 'PENDING' || status.status === 'PROCESSING',
          true // Include the final emission
        ),
        catchError(error => {
          console.error('Error polling job status:', error);
          this.updateJobError(jobId, 'Failed to get job status');
          return throwError(() => error);
        })
      )
      .subscribe({
        complete: () => {
          console.log('Polling complete for job:', jobId);
        }
      });
  }

  /**
   * Update job state based on status response
   * Enriches the optimized sequence with full provider data from cache
   */
  private updateJobInState(jobId: string, status: JobStatusResponse): void {
    const currentJobs = this._activeJobs$.value;

    const updatedJobs = currentJobs.map(job => {
      if (job.jobId === jobId) {
        const updatedJob: OptimizationJob = {
          ...job,
          status: status.status,
          progress: status.progressPercentage,
          message: status.message
        };

        // If completed, store result and ENRICH with provider data
        if (status.status === 'COMPLETED' && status.result) {
          const enrichedResult = enrichOptimizationResultAdapter(status.result as OptimizationResult, this._providers$.value);
          updatedJob.result = enrichedResult;
          updatedJob.completedAt = new Date();

          console.log('✨ ENRICHED OPTIMIZATION RESULT:', enrichedResult);
        }

        // If failed, store error
        if (status.status === 'FAILED' && status.error) {
          updatedJob.error = status.error.message;
          updatedJob.completedAt = new Date();
        }

        return updatedJob;
      }
      return job;
    });

    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    // This ensures state updates happen outside the current change detection cycle
    setTimeout(() => {
      this._activeJobs$.next(updatedJobs);
    }, 0);
  }

  /**
   * Enrich optimization result with full provider data
   * Takes the bare-bones result from backend and adds:
   * - Provider details (name, coordinates from enriched data)
   * - Service information (cost, category)
   * - All metadata from EnrichedProviderData
   */
  /**
   * Update job with error message
   */
  private updateJobError(jobId: string, errorMessage: string): void {
    const currentJobs = this._activeJobs$.value;

    const updatedJobs = currentJobs.map(job => {
      if (job.jobId === jobId) {
        return {
          ...job,
          status: 'FAILED' as const,
          error: errorMessage,
          completedAt: new Date()
        };
      }
      return job;
    });

    this._activeJobs$.next(updatedJobs);
  }

  /**
   * Cancel a running job
   * Uses RouteOptimizationService for job cancellation
   */
  cancelJob(jobId: string): void {
    console.log('Cancelling job:', jobId);

    this.routeOptimizationService.cancelJob(jobId)
      .pipe(
        catchError(error => {
          console.error('Error cancelling job:', error);
          return throwError(() => error);
        })
      )
      .subscribe(() => {
        // Update job status
        const currentJobs = this._activeJobs$.value;
        const updatedJobs = currentJobs.map(job => {
          if (job.jobId === jobId) {
            return {
              ...job,
              status: 'CANCELLED' as const,
              message: 'Job cancelled by user',
              completedAt: new Date()
            };
          }
          return job;
        });

        this._activeJobs$.next(updatedJobs);
        console.log('Job cancelled successfully:', jobId);
      });
  }

  /**
   * Remove a job from the active jobs list
   */
  removeJob(jobId: string): void {
    const currentJobs = this._activeJobs$.value;
    const updatedJobs = currentJobs.filter(job => job.jobId !== jobId);
    this._activeJobs$.next(updatedJobs);
    console.log('Job removed from list:', jobId);
  }

  /**
   * Clear all completed and failed jobs
   */
  clearCompletedJobs(): void {
    const currentJobs = this._activeJobs$.value;
    const activeJobs = currentJobs.filter(job =>
      job.status === 'PENDING' || job.status === 'PROCESSING'
    );
    this._activeJobs$.next(activeJobs);
    console.log('Cleared completed jobs');
  }

  /**
   * Reset the route builder to initial state
   */
  resetRouteBuilder(): void {
    this._selectedPois$.next([
      { id: crypto.randomUUID(), providerId: null, selectedService: null, providerData: null }
    ]);
    console.log('Route builder reset');
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this._error$.next(null);
  }

  /**
   * Exposes a snapshot of the currently cached enriched providers. Used by
   * other services that need enrichment data without duplicating HTTP calls.
   */
  getCachedProviders(): EnrichedProviderData[] {
    return this._providers$.value;
  }

  // ==================================================
  // MAP UI STATE MANAGEMENT
  // ==================================================

  /**
   * Sets the active provider for the general map view.
   */
  setActiveProvider(providerId: number | null): void {
    // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this._activeProviderId$.next(providerId);
    }, 0);
  }

  /**
   * Selects the next provider in the list.
   */
  selectNextProvider(): void {
    const providers = this._providers$.value;
    if (providers.length === 0) return;

    const currentId = this._activeProviderId$.value;
    const currentIndex = providers.findIndex(p => p.provider.id === currentId);
    const nextIndex = (currentIndex + 1) % providers.length;

    this.setActiveProvider(providers[nextIndex].provider.id);
  }

  /**
   * Selects the previous provider in the list.
   */
  selectPreviousProvider(): void {
    const providers = this._providers$.value;
    if (providers.length === 0) return;

    const currentId = this._activeProviderId$.value;
    const currentIndex = providers.findIndex(p => p.provider.id === currentId);
    const prevIndex = (currentIndex - 1 + providers.length) % providers.length;

    this.setActiveProvider(providers[prevIndex].provider.id);
  }

  /**
   * Sets the active optimized POI for the detailed map view.
   */
  setActiveOptimizedPoi(poiId: number | string | null): void {
    // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this._activeOptimizedPoiId$.next(poiId);
    }, 0);
  }

  /**
   * Selects the next optimized POI in the list.
   */
  selectNextOptimizedPoi(): void {
    const currentId = this._activeOptimizedPoiId$.value;
    const optimizedPois = this._activeJobs$.value.find(j => j.jobId === this._selectedJobId$.value)?.result?.optimizedSequence;
    if (!optimizedPois || !currentId) return;

    const currentIndex = optimizedPois.findIndex(poi => poi.poiId === currentId);
    const nextIndex = (currentIndex + 1) % optimizedPois.length;
    this.setActiveOptimizedPoi(optimizedPois[nextIndex].poiId);
  }

  selectPreviousOptimizedPoi(): void {
    const currentId = this._activeOptimizedPoiId$.value;
    const optimizedPois = this._activeJobs$.value.find(j => j.jobId === this._selectedJobId$.value)?.result?.optimizedSequence;
    if (!optimizedPois || !currentId) return;

    const currentIndex = optimizedPois.findIndex(poi => poi.poiId === currentId);
    const prevIndex = (currentIndex - 1 + optimizedPois.length) % optimizedPois.length;
    this.setActiveOptimizedPoi(optimizedPois[prevIndex].poiId);
  }

  // Job history management
  selectJob(jobId: string | null): void {
    // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this._selectedJobId$.next(jobId);
    }, 0);
  }

  /**
   * Clears the active provider and optimized POI selection.
   */
  clearActiveSelections(): void {
    this.setActiveProvider(null);
    this.setActiveOptimizedPoi(null);
  }

  /**
   * Zooms the map to fit all providers in the current route.
   */
  zoomToFitProviders(map: any): void {
    const providers = this._selectedPois$.value
      .map(row => this._providers$.value.find(p => p.provider.id === row.providerId))
      .filter((provider): provider is EnrichedProviderData => provider !== undefined);

    if (providers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    providers.forEach(provider => {
      if (provider.provider.coordenadaX && provider.provider.coordenadaY) {
        bounds.extend(new google.maps.LatLng(provider.provider.coordenadaX, provider.provider.coordenadaY));
      }
    });

    map.fitBounds(bounds);
  }

  /**
   * Zooms the map to fit the optimized route.
   */
  zoomToFitRoute(map: any, jobId: string): void {
    const job = this._activeJobs$.value.find(j => j.jobId === jobId);
    if (!job || !job.result || !job.result.optimizedSequence || job.result.optimizedSequence.length === 0) {
      console.warn('Cannot zoom to fit route, no data available');
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    job.result.optimizedSequence.forEach(poi => {
      if (poi.latitude && poi.longitude) {
        bounds.extend(new google.maps.LatLng(poi.latitude, poi.longitude));
      }
    });

    map.fitBounds(bounds);
  }

  /**
   * Centers the map on the active provider.
   */
  centerMapOnActiveProvider(map: any): void {
    const provider = this._providers$.value.find(p => p.provider.id === this._activeProviderId$.value);
    if (provider && provider.provider.coordenadaX && provider.provider.coordenadaY) {
      map.setCenter(new google.maps.LatLng(provider.provider.coordenadaX, provider.provider.coordenadaY));
    }
  }

  /**
   * Centers the map on the active optimized POI.
   */
  centerMapOnActiveOptimizedPoi(map: any): void {
    const allPois = this._activeJobs$.value.flatMap(j => j.result?.optimizedSequence ?? []);
    const poi = allPois.find(p => p.poiId === this._activeOptimizedPoiId$.value);
    if (poi && poi.latitude && poi.longitude) {
      map.setCenter(new google.maps.LatLng(poi.latitude, poi.longitude));
    }
  }

  /**
   * Toggles the visibility of the route on the map.
   */
  toggleRouteVisibility(map: any, jobId: string): void {
    const job = this._activeJobs$.value.find(j => j.jobId === jobId);
    if (!job || !job.result || !job.result.optimizedSequence || job.result.optimizedSequence.length === 0) {
      console.warn('Cannot toggle route visibility, no data available');
      return;
    }

    const route = job.result.optimizedSequence;
    const isVisible = map.getRouteVisibility(jobId);

    if (isVisible) {
      map.hideRoute(jobId);
    } else {
      map.showRoute(route, jobId);
    }
  }

  /**
   * Exports the optimized route to GPX format.
   */
  exportRouteToGPX(jobId: string): string | null {
    const job = this._activeJobs$.value.find(j => j.jobId === jobId);
    if (!job || !job.result || !job.result.optimizedSequence || job.result.optimizedSequence.length === 0) {
      console.warn('Cannot export route to GPX, no data available');
      return null;
    }

    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
    <gpx version="1.1" creator="RouteBuilder">
      <metadata>
        <name>${job.routeName}</name>
        <desc>Optimized route generated by RouteBuilder</desc>
        <author>RouteBuilder</author>
        <time>${job.completedAt ? job.completedAt.toISOString() : new Date().toISOString()}</time>
      </metadata>
      <trk>
        <name>${job.routeName}</name>
        <trkseg>`;
    const gpxFooter = `</trkseg>
      </trk>
    </gpx>`;

    const gpxBody = job.result.optimizedSequence.map(poi => {
      return `
        <trkpt lat="${poi.latitude}" lon="${poi.longitude}">
          <time>${poi.arrivalTime ? new Date(poi.arrivalTime).toISOString() : ''}</time>
          <name>${poi.name}</name>
        </trkpt>`;
    }).join('');

    return gpxHeader + gpxBody + gpxFooter;
  }
}
