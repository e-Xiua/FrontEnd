import { Injectable } from '@angular/core';
import { OptimizationResult } from '../../services/route-optimization.service';
import { Route } from '../route';
import { OptimizedPoiAdapterService } from './optimized-poi-adapter';


@Injectable({
  providedIn: 'root'
})
export class OptimizationResultAdapterService {

  // Inject the existing adapter for POIs
  constructor(private poiAdapter: OptimizedPoiAdapterService) { }

  /**
   * Adapts a single OptimizationResult object to a Route object.
   * @param result The OptimizationResult to adapt.
   * @returns A Route object compatible with ShowRoutesManyOptionsComponent.
   */
  public adapt(result: OptimizationResult): Route {
    // The core of the Adapter Pattern: mapping the parent object.
    return {
      id: result.optimizedRouteId,
      name: `Ruta Optimizada #${result.optimizedRouteId.substring(0, 8)}`,
      description: `Ruta generada el ${new Date(result.generatedAt).toLocaleDateString()} con ${result.optimizedSequence.length} paradas.`,

      // Here we use the existing adapter to transform the nested array!
      providers: this.poiAdapter.adaptAll(result.optimizedSequence),

      // Map other relevant properties
      estimatedDistance: result.totalDistanceKm,
      estimatedTime: result.totalTimeMinutes,

      // Provide default values for properties not present in OptimizationResult
      rating: 4.5, // Example default rating
      category: 'Optimized',
      difficulty: this.getDifficulty(result.totalDistanceKm, result.totalTimeMinutes),
      tags: ['optimizado', 'automático']
    };
  }

  /**
   * Adapts an array of OptimizationResult objects to an array of Route objects.
   * @param results The array of OptimizationResult to adapt.
   * @returns An array of Route objects.
   */
  public adaptAll(results: OptimizationResult[]): Route[] {
    if (!results) {
      return [];
    }
    return results.map(result => this.adapt(result));
  }

  /**
   * Helper function to determine a route's difficulty based on its stats.
   * @param distance in km
   * @param time in minutes
   * @returns 'easy', 'medium', or 'hard'
   */
  private getDifficulty(distance: number, time: number): 'easy' | 'medium' | 'hard' {
    if (distance < 10 && time < 60) {
      return 'easy';
    } else if (distance < 50 && time < 180) {
      return 'medium';
    } else {
      return 'hard';
    }
  }
}
