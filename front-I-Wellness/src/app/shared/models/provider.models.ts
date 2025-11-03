/**
 * Provider Models
 * 
 * These interfaces define the structure for provider and service data
 * used throughout the route optimization feature.
 */

/**
 * Represents a single service offered by a provider
 */
export interface Service {
  idServicio: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempoAproximado: number; // Visit duration in minutes
}

/**
 * Represents the provider's core information
 */
export interface Provider {
  id: number;
  nombre_empresa: string;
  coordenadax: number; // Latitude
  coordenaday: number; // Longitude
}

/**
 * Enriched provider data returned from backend
 * GET /api/route-processing/provider/{id}/enriched
 */
export interface EnrichedProviderData {
  provider: Provider;
  services: Service[];
  averageCost: number;
  averageVisitDuration: number;
  categories: string[];
}
