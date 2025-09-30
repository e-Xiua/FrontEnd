import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, interval, map, switchMap, takeWhile } from 'rxjs';

export interface OptimizationPOI {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
  subcategory?: string;
  visitDuration?: number;
  cost?: number;
  rating?: number;
  openingHours?: string;
  description?: string;
  imageUrl?: string;
  accessibility?: boolean;
  providerId?: number;
  providerName?: string;
}

export interface RouteOptimizationRequest {
  routeId?: string;
  userId?: string;
  pois: OptimizationPOI[];
  preferences?: {
    optimizeFor?: string;
    maxTotalTime?: number;
    maxTotalCost?: number;
    preferredCategories?: string[];
    avoidCategories?: string[];
    accessibilityRequired?: boolean;
  };
  constraints?: {
    startLocation?: { latitude: number; longitude: number };
    endLocation?: { latitude: number; longitude: number };
    startTime?: string;
    lunchBreakRequired?: boolean;
    lunchBreakDuration?: number;
  };
}

export interface JobSubmissionResponse {
  job_id: string;
  polling_url: string;
  message: string;
  estimated_completion_time: string;
  retry_after_seconds: number;
  status: string;
  created_at: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  message: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  estimated_completion_time?: string;
  retry_after_seconds?: number;
  result?: OptimizationResult;
  error?: {
    code: string;
    message: string;
    details: string;
  };
}

export interface OptimizationResult {
  optimizedRouteId: string;
  optimizedSequence: OptimizedPOI[];
  totalDistanceKm: number;
  totalTimeMinutes: number;
  optimizationAlgorithm: string;
  optimizationScore: number;
  generatedAt: string;
}

export interface OptimizedPOI {
  poiId: number;
  name: string;
  latitude: number;
  longitude: number;
  visitOrder: number;
  estimatedVisitTime: number;
  arrivalTime?: string;
  departureTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RouteOptimizationService {

  private readonly baseUrl = 'http://localhost:8085/api/v1';

  constructor(private http: HttpClient) {}

  /**
   * Submit route optimization request (returns 202 Accepted)
   */
  submitOptimizationRequest(request: RouteOptimizationRequest): Observable<JobSubmissionResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<JobSubmissionResponse>(
      `${this.baseUrl}/routes/optimize`,
      request,
      { headers }
    );
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Observable<JobStatusResponse> {
    return this.http.get<JobStatusResponse>(`${this.baseUrl}/jobs/${jobId}/status`);
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/jobs/${jobId}`);
  }

  /**
   * Poll for job completion using Request-Response with Status Polling pattern
   */
  pollForCompletion(jobId: string, maxAttempts: number = 60): Observable<JobStatusResponse> {
    return interval(2000) // Poll every 2 seconds
      .pipe(
        switchMap(() => this.getJobStatus(jobId)),
        takeWhile((status, index) => {
          // Continue polling while status is PENDING or PROCESSING and haven't exceeded max attempts
          return (status.status === 'PENDING' || status.status === 'PROCESSING') && index < maxAttempts;
        }, true), // Include the final emission that fails the condition
        map(status => {
          console.log(`Job ${jobId} status: ${status.status} (${status.progress_percentage}%)`);
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
        console.log(`Route optimization job submitted: ${submission.job_id}`);
        console.log(`Estimated completion: ${submission.estimated_completion_time}`);

        return this.pollForCompletion(submission.job_id);
      }),
      map(finalStatus => {
        if (finalStatus.status === 'COMPLETED' && finalStatus.result) {
          console.log('Route optimization completed successfully!');
          return finalStatus.result;
        } else if (finalStatus.status === 'FAILED') {
          const errorMsg = finalStatus.error ?
            `${finalStatus.error.message}: ${finalStatus.error.details}` :
            'Unknown error occurred';
          throw new Error(`Route optimization failed: ${errorMsg}`);
        } else {
          throw new Error(`Route optimization ended with unexpected status: ${finalStatus.status}`);
        }
      })
    );
  }

  /**
   * Get mock POIs for testing
   */
  getMockPOIs(routeType: string = 'random', count: number = 8): Observable<OptimizationPOI[]> {
    const params: any = {};
    if (routeType !== 'random') params.routeType = routeType;
    if (count !== 8) params.count = count;

    return this.http.get<OptimizationPOI[]>(`${this.baseUrl}/pois/mock`, { params });
  }

  /**
   * Get all available mock POIs
   */
  getAllMockPOIs(): Observable<OptimizationPOI[]> {
    return this.http.get<OptimizationPOI[]>(`${this.baseUrl}/pois/all`);
  }

  /**
   * Health check
   */
  healthCheck(): Observable<{status: string, service: string, timestamp: string}> {
    return this.http.get<{status: string, service: string, timestamp: string}>(`${this.baseUrl}/health`);
  }
}
