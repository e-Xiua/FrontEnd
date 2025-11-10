/**
 * Route Builder Models
 * 
 * These interfaces define the structure for building routes
 * in the interactive table component.
 */

import { EnrichedProviderData, Service } from './provider.models';

/**
 * Represents a single row in the route builder table
 * Each row allows selection of a provider and optionally a specific service
 */
export interface RouteRow {
  id: string; // UUID for tracking in the UI
  providerId: number | null;
  selectedService: Service | null;
  providerData: EnrichedProviderData | null;
}

/**
 * Route optimization request payload
 * Sent to POST /api/route-processing/submit-optimization-job
 */
export interface RouteOptimizationRequest {
  userId: number;
  providerIds: number[];
  optimizeFor?: 'distance' | 'cost' | 'time';
  maxBudget?: number;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  touristPreferences?: string[];
  requiredCategories?: string[];
}

/**
 * Route averages calculated from selected POIs
 * Used for display in the route builder table
 */
export interface RouteAverages {
  avgDuration: number;
  avgCost: number;
  totalPOIs: number;
}
