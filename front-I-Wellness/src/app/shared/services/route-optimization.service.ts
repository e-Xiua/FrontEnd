import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, catchError, interval, map, mergeMap, of, switchMap, takeWhile } from 'rxjs';
import {
  JobSubmissionResponse,
  JobStatusResponse,
  OptimizationResult,
  OptimizedPOI,
} from '../models/optimization-job.models';
import { RouteOptimizationRequest } from '../models/route-builder.models';

// Type alias for raw backend responses to avoid confusion
type BackendJobSubmissionResponse = any;
type BackendJobStatusResponse = any;
type BackendOptimizationResult = any;

@Injectable({
  providedIn: 'root'
})
export class RouteOptimizationService {

  private readonly baseUrlJobStatus = 'http://localhost:8085/api/v1';
  private readonly baseUrl = 'http://localhost:8085/api/route-processing';

  constructor(private http: HttpClient) {}

  /**
   * Submit route optimization request (returns 202 Accepted)
   */
  submitOptimizationRequest(request: RouteOptimizationRequest): Observable<JobSubmissionResponse> {
    
    const token = localStorage.getItem('token');
      
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.post<BackendJobSubmissionResponse>(
      `${this.baseUrl}/submit-optimization-job`,
      request,
      { headers }
    ).pipe(
      map(this.mapToJobSubmissionResponse)
    );
  }

  /**
   * Submit route optimization request (returns 202 Accepted)
   */
  enrichProvidersData(providerID: number): Observable<any> {

    const token = localStorage.getItem('token');
      
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.get<any>(
      `${this.baseUrl}/provider/${providerID}/enriched`,
      
      { headers }
    );
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Observable<JobStatusResponse> {
    return this.http.get<BackendJobStatusResponse>(`${this.baseUrlJobStatus}/jobs/${jobId}/status`).pipe(
      map(res => this.mapToJobStatusResponse(res))
    );
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrlJobStatus}/jobs/${jobId}`);
  }

  /**
   * Poll for job completion using Request-Response with Status Polling pattern
   */
  pollForCompletion(jobId: string, maxAttempts: number = 10000): Observable<JobStatusResponse> {
    return interval(2000) // Poll every 2 seconds
      .pipe(
        switchMap(() => this.getJobStatus(jobId)),
        takeWhile((status, index) => {
          // Continue polling while status is PENDING or PROCESSING and haven't exceeded max attempts
          return (status.status === 'PENDING' || status.status === 'PROCESSING') && index < maxAttempts;
        }, true), // Include the final emission that fails the condition
        map(status => {
          console.log(`Job ${jobId} status: ${status.status} (${status.progressPercentage}%)`);
          return status;
        }),
        catchError(error => {
          console.error('Error polling job status:', error);
          throw error;
        })
      );
  }

  /**
   * Complete optimization workflow: submit request and poll for completion
   */

  optimizeRouteComplete(request: RouteOptimizationRequest): Observable<OptimizationResult> {
    return this.submitOptimizationRequest(request).pipe(
      switchMap(submission => {
        console.log(`Route optimization job submitted: ${submission.jobId}`);
        console.log(`Estimated completion: ${submission.estimatedCompletionTime}`);

        return this.pollForCompletion(submission.jobId);
      }),
      // Usa mergeMap para transformar el valor en un nuevo stream
      mergeMap(finalStatus => {
        if (finalStatus.status === 'COMPLETED' && finalStatus.result) {
          console.log('Route optimization completed successfully!');
          // Devuelve un observable que emite el resultado y se completa
          return of(finalStatus.result);
        }

        if (finalStatus.status === 'FAILED') {
          const errorMsg = finalStatus.error ?
            `${finalStatus.error.message}: ${finalStatus.error.details}` :
            'Unknown error occurred';
          // Lanza un error que será propagado por el observable
          throw new Error(`Route optimization failed: ${errorMsg}`);
        }

        if (finalStatus.status === 'PROCESSING' || finalStatus.status === 'PENDING') {
          console.warn(`Client timeout: The optimization is still processing on the server. Job ID: ${finalStatus.jobId}`);
          // Devuelve un observable que se completa inmediatamente sin emitir nada
          return EMPTY;
        }

        // Para cualquier otro caso, lanza un error
        throw new Error(`Route optimization ended with unexpected status: ${finalStatus.status}`);
      })

    );
  }

  /**
   * Health check
   */
  healthCheck(): Observable<{status: string, service: string, timestamp: string}> {
    return this.http.get<{status: string, service: string, timestamp: string}>(`${this.baseUrl}/health`);
  }

  /**
   * Get all routes completed so far
   */
  getCompletedRoutes(userId?: string): Observable<OptimizationResult[]> {
    const options = userId ? { params: new HttpParams().set('userId', userId) } : {};

    return this.http.get<any>(`${this.baseUrlJobStatus}/routes/completed`, options).pipe(
      map((response: any) => {
        const payload = Array.isArray(response) ? response : (response ? [response] : []);
        return payload.map(route => this.mapToOptimizationResult(route));
      })
    );
  }

  getCompletedRoutesByUser(userId: string): Observable<OptimizationResult[]> {
    return this.getCompletedRoutes(userId);
  }

  /**
   * @deprecated Use getCompletedRoutes instead.
   */
  getAllRoutes(): Observable<OptimizationResult[]> {
    console.warn('RouteOptimizationService.getAllRoutes is deprecated. Use getCompletedRoutes instead.');
    return this.getCompletedRoutes();
  }

  /**
   * @deprecated Use getCompletedRoutesByUser instead.
   */
  getAllRoutesByUser(userId: string): Observable<OptimizationResult[]> {
    console.warn('RouteOptimizationService.getAllRoutesByUser is deprecated. Use getCompletedRoutesByUser instead.');
    return this.getCompletedRoutesByUser(userId);
  }

  // ==================================================
  // PRIVATE DATA MAPPING ADAPTERS
  // ==================================================

  /**
   * Maps snake_case backend response to camelCase JobSubmissionResponse model.
   */
  private mapToJobSubmissionResponse(backendResponse: BackendJobSubmissionResponse): JobSubmissionResponse {
    return {
      jobId: backendResponse.job_id,
      status: backendResponse.status,
      message: backendResponse.message,
      pollingUrl: backendResponse.polling_url,
      estimatedCompletionTime: backendResponse.estimated_completion_time,
      retryAfterSeconds: backendResponse.retry_after_seconds,
      createdAt: backendResponse.created_at,
    };
  }

  /**
   * Maps snake_case backend response to camelCase JobStatusResponse model.
   */
  private mapToJobStatusResponse(backendResponse: BackendJobStatusResponse): JobStatusResponse {
    return {
      jobId: backendResponse.job_id,
      status: backendResponse.status,
      message: backendResponse.message,
      progressPercentage: backendResponse.progress_percentage,
      createdAt: backendResponse.created_at,
      updatedAt: backendResponse.updated_at,
      completedAt: backendResponse.completed_at,
      estimatedCompletionTime: backendResponse.estimated_completion_time,
      retryAfterSeconds: backendResponse.retry_after_seconds,
      result: backendResponse.result ? this.mapToOptimizationResult(backendResponse.result) : undefined,
      error: backendResponse.error,
    };
  }

  /**
   * Maps snake_case backend result to camelCase OptimizationResult model.
   */
  private mapToOptimizationResult(backendResult: BackendOptimizationResult): OptimizationResult {
    const optimizedSequence = backendResult.optimizedSequence || backendResult.optimized_sequence || [];

    return {
      optimizedRouteId: backendResult.optimizedRouteId || backendResult.optimized_route_id || backendResult.routeId,
      optimizedSequence: optimizedSequence.map((poi: any) => this.mapToOptimizedPOI(poi)),
      totalDistanceKm: backendResult.totalDistanceKm ?? backendResult.total_distance_km ?? 0,
      totalTimeMinutes: backendResult.totalTimeMinutes ?? backendResult.total_time_minutes ?? 0,
      optimizationAlgorithm: backendResult.optimizationAlgorithm || backendResult.optimization_algorithm || 'Unknown',
      optimizationScore: backendResult.optimizationScore ?? backendResult.optimization_score ?? 0,
      generatedAt: backendResult.generatedAt || backendResult.generated_at || new Date().toISOString(),
    };
  }

    /**
   * Maps snake_case backend POI to camelCase OptimizedPOI model.
   */
  private mapToOptimizedPOI(backendPOI: any): OptimizedPOI {
    return {
      poiId: backendPOI.poiId ?? backendPOI.poi_id,
      name: backendPOI.name,
      latitude: backendPOI.latitude ?? backendPOI.lat,
      longitude: backendPOI.longitude ?? backendPOI.lng,
      visitOrder: backendPOI.visitOrder ?? backendPOI.visit_order ?? 0,
      estimatedVisitTime: backendPOI.estimatedVisitTime ?? backendPOI.estimated_visit_time ?? 0,
      arrivalTime: backendPOI.arrivalTime ?? backendPOI.arrival_time,
      departureTime: backendPOI.departureTime ?? backendPOI.departure_time,
    };
  }
}
