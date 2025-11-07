/**
 * Optimization Job Models
 * 
 * These interfaces define the structure for route optimization jobs,
 * following the Request-Response with Status Polling pattern.
 */

/**
 * Job submission response (immediate response from backend)
 * Returned from POST /api/route-processing/submit-optimization-job
 * Status: 202 Accepted
 */
export interface JobSubmissionResponse {
  jobId: string;
  status: string;
  message: string;
  pollingUrl: string;
  estimatedCompletionTime: string; // ISO 8601 date string
  retryAfterSeconds?: number;
  createdAt?: string;
}

/**
 * Job status response (from polling endpoint)
 * Returned from GET /api/v1/jobs/{jobId}/status
 */
export interface JobStatusResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  message: string;
  progressPercentage: number;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  completedAt?: string; // ISO 8601 date string, available on completion
  estimatedCompletionTime?: string;
  retryAfterSeconds?: number;
  resultUrl?: string; // URL to fetch the final result
  result?: OptimizationResult; // The final route data, included when status is 'COMPLETED'
  error?: JobError;
}

/**
 * Job error details
 */
export interface JobError {
  code: string;
  message: string;
  details: string;
}

/**
 * Optimized route result
 * Included in JobStatusResponse when status is 'COMPLETED'
 */
export interface OptimizationResult {
  optimizedRouteId: string;
  optimizedSequence: OptimizedPOI[];
  totalDistanceKm: number;
  totalTimeMinutes: number;
  optimizationAlgorithm: string;
  optimizationScore: number;
  generatedAt: string; // ISO 8601 date string
  metadata?: {
    [key: string]: any;
  };
}

/**
 * A single POI in the optimized sequence
 */
export interface OptimizedPOI {
  poiId: number;
  name: string;
  latitude: number;
  longitude: number;
  visitOrder: number;
  estimatedVisitTime: number;
  arrivalTime?: string;
  departureTime?: string;
  category?: string;
  cost?: number;
  // Enriched data (added after optimization completes)
  providerData?: any; // Full EnrichedProviderData for displaying on map
}

/**
 * Frontend job tracking (internal state)
 * Used by RouteBuilderStateService to manage active jobs
 */
export interface OptimizationJob {
  jobId: string;
  routeName: string;
  status: JobStatusResponse['status'];
  progress: number;
  message: string;
  result: OptimizationResult | null;
  error: string | null;
  submittedAt: Date;
  completedAt?: Date;
  estimatedCompletionTime?: Date;
}
