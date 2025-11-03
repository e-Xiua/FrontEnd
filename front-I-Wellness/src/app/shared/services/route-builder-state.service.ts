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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, throwError, forkJoin } from 'rxjs';
import { map, switchMap, takeWhile, tap, catchError, finalize } from 'rxjs/operators';

// Services
import { UsuarioService } from '../../features/users/services/usuario.service';
import { RouteOptimizationService } from './route-optimization.service';
import { ProviderDataAdapter, BackendProviderResponse, BackendServiceResponse } from '../adapters/provider-data.adapter';

// Models
import {
  EnrichedProviderData,
  RouteRow,
  RouteOptimizationRequest,
  JobSubmissionResponse,
  JobStatusResponse,
  OptimizationJob,
  OptimizationResult
} from '../models/route-generation';
import { ServicioService } from '../../features/servicios/services/servicio.service';

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

  // ========== PUBLIC OBSERVABLES (Read-only) ==========

  public readonly providers$ = this._providers$.asObservable();
  public readonly selectedPois$ = this._selectedPois$.asObservable();
  public readonly activeJobs$ = this._activeJobs$.asObservable();
  public readonly isLoading$ = this._isLoading$.asObservable();
  public readonly error$ = this._error$.asObservable();

  // Computed observables
  public readonly completedJobs$: Observable<OptimizationJob[]> = this.activeJobs$.pipe(
    map(jobs => jobs.filter(job => job.status === 'COMPLETED'))
  );

  public readonly processingJobs$: Observable<OptimizationJob[]> = this.activeJobs$.pipe(
    map(jobs => jobs.filter(job => job.status === 'PROCESSING' || job.status === 'PENDING'))
  );

  constructor(
    private http: HttpClient,
    private servicioService: ServicioService,
    private usuarioService: UsuarioService,
    private routeOptimizationService: RouteOptimizationService,
    private providerAdapter: ProviderDataAdapter
  ) {
    console.log('RouteBuilderStateService initialized');
  }

  // ========== PUBLIC METHODS (Actions) ==========

  /**
   * Load all available providers and enrich with services data
   * 
   * Flow:
   * 1. Fetch all providers from UsuarioService
   * 2. For each provider, fetch their services from providers API
   * 3. Transform to EnrichedProviderData using adapter
   */
  loadProviders(): void {
    this._isLoading$.next(true);
    this._error$.next(null);

    console.log('Loading all providers via UsuarioService');

    this.usuarioService.obtenerProveedores()
      .pipe(
        switchMap((providers: BackendProviderResponse[]) => {
          console.log(`Fetched ${providers.length} providers, now fetching services for each...`);
          
          // Fetch services for each provider in parallel
          const serviceRequests = providers.map(provider =>
            this.servicioService.obtenerServiciosPorProveedor(provider.id).pipe(
              map(services => ({ providerId: provider.id, services })),
              catchError(error => {
                console.warn(`Failed to fetch services for provider ${provider.id}:`, error);
                // Return empty services array if fetch fails
                return [{ providerId: provider.id, services: [] }];
              })
            )
          );

          // Wait for all service requests to complete
          return forkJoin(serviceRequests).pipe(
            map(servicesResults => {
              // Create a map of providerId -> services
              const servicesMap = new Map<number, BackendServiceResponse[]>();
              servicesResults.forEach(result => {
                servicesMap.set(result.providerId, result.services);
              });

              // Transform to EnrichedProviderData
              const enrichedProviders = this.providerAdapter.adaptProviders(providers, servicesMap);
              
              console.log(`Enriched ${enrichedProviders.length} providers with services`);
              return enrichedProviders;
            })
          );
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
        console.log('Sample enriched provider:', enrichedProviders[0]);
      });
  }  /**
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

    console.log('=== ENRICHED PROVIDER DATA FOR ROW ===');
    console.log('Row ID:', rowId);
    console.log('Provider ID:', providerId);
    console.log('Enriched Data:', providerData);
    console.log('Provider Info:', providerData.provider);
    console.log('Services:', providerData.services);
    console.log('Average Cost:', providerData.averageCost);
    console.log('Average Duration:', providerData.averageVisitDuration);
    console.log('Categories:', providerData.categories);
    console.log('======================================');

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
        return {
          ...row,
          selectedService: service || null
        };
      }
      return row;
    });

    this._selectedPois$.next(updatedRows);
    console.log('Updated row service:', rowId, serviceId);
  }

  /**
   * Start route optimization
   * Submits the job and starts polling for status
   * Uses RouteOptimizationService for job submission
   */
  startOptimization(userId: number, optimizeFor: 'distance' | 'cost' | 'time' = 'distance'): void {
    const selectedRows = this._selectedPois$.value.filter(row =>
      row.providerId && row.selectedService
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

    console.log('Submitting optimization request via RouteOptimizationService:', request);
    console.log('Selected providers:', providerIds);
    console.log('User ID:', userId);
    console.log('Optimize for:', optimizeFor);

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

        // If completed, store result
        if (status.status === 'COMPLETED' && status.result) {
          updatedJob.result = status.result;
          updatedJob.completedAt = new Date();
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

    this._activeJobs$.next(updatedJobs);
  }

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
}
