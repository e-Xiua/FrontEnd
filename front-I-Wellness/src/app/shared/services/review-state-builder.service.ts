import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReviewState, ReviewStateConfig, ReviewStateService } from './review-state.service';

/**
 * Builder Pattern para configurar y gestionar el estado de reseñas
 * Facilita la creación y configuración de estados de reseñas de forma fluida
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewStateBuilder {
  private config: Partial<ReviewStateConfig> = {};

  constructor(private reviewStateService: ReviewStateService) {}

  /**
   * Establece el ID de la entidad (servicio o proveedor)
   */
  forEntity(entityId: number): this {
    this.config.entityId = entityId;
    return this;
  }

  /**
   * Establece el tipo de entidad
   */
  ofType(entityType: 'PROVIDER' | 'SERVICE'): this {
    this.config.entityType = entityType;
    return this;
  }

  /**
   * Establece el ID del usuario actual
   */
  withUser(userId: number): this {
    this.config.userId = userId;
    return this;
  }

  /**
   * Establece el rol del usuario actual
   */
  withRole(userRole: string): this {
    this.config.userRole = userRole;
    return this;
  }

  /**
   * Establece el servicio de reviews a utilizar
   */
  usingService(reviewService: any): this {
    this.config.reviewService = reviewService;
    return this;
  }

  /**
   * Construye la configuración completa
   */
  private buildConfig(): ReviewStateConfig {
    if (!this.config.entityId) {
      throw new Error('Entity ID is required');
    }
    if (!this.config.entityType) {
      throw new Error('Entity type is required');
    }
    if (!this.config.reviewService) {
      throw new Error('Review service is required');
    }

    return this.config as ReviewStateConfig;
  }

  /**
   * Inicializa el estado con la configuración actual
   */
  initialize(): Observable<ReviewState> {
    const config = this.buildConfig();
    return this.reviewStateService.initializeState(config);
  }

  /**
   * Obtiene el observable del estado
   */
  getState$(): Observable<ReviewState> {
    if (!this.config.entityId || !this.config.entityType) {
      throw new Error('Entity ID and type are required');
    }
    return this.reviewStateService.getState(this.config.entityType, this.config.entityId);
  }

  /**
   * Obtiene el estado actual (síncrono)
   */
  getCurrentState(): ReviewState {
    if (!this.config.entityId || !this.config.entityType) {
      throw new Error('Entity ID and type are required');
    }
    return this.reviewStateService.getCurrentState(this.config.entityType, this.config.entityId);
  }

  /**
   * Envía una reseña (crea o edita)
   */
  submitReview(reviewData: any): Observable<void> {
    const config = this.buildConfig();
    return this.reviewStateService.submitReview(config, reviewData);
  }

  /**
   * Elimina una reseña
   */
  deleteReview(reviewId: number): Observable<void> {
    const config = this.buildConfig();
    return this.reviewStateService.deleteReview(config, reviewId);
  }

  /**
   * Limpia el estado
   */
  clear(): void {
    if (!this.config.entityId || !this.config.entityType) {
      return;
    }
    this.reviewStateService.clearState(this.config.entityType, this.config.entityId);
  }

  /**
   * Resetea el builder para una nueva configuración
   */
  reset(): this {
    this.config = {};
    return this;
  }
}
