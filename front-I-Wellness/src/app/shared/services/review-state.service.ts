import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth/auth.service';
import { ReservaService } from '../../features/servicios/reservas/reserva.service';
import { Review } from '../ui/components/review-display/review-display.component';
import { ReviewSubmission } from '../ui/components/review-form/review-form.component';

/**
 * Estado de permisos de reseñas para un usuario
 */
export interface ReviewPermissions {
  canWrite: boolean;
  canEdit: boolean;
  hasReservation: boolean;
  existingReviewId?: number;
  reason?: string;
}

/**
 * Estado completo de reseñas para una entidad
 */
export interface ReviewState {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  permissions: ReviewPermissions;
  isLoading: boolean;
  error?: string;
}

/**
 * Configuración para el builder de estado de reseñas
 */
export interface ReviewStateConfig {
  entityId: number;
  entityType: 'proveedor' | 'servicio';
  userId?: number;
  userRole?: string;
  reviewService: any; // El servicio específico de reviews (ReviewsCallService)
}

/**
 * Servicio de gestión de estado reactivo para reseñas
 * Proporciona una capa de abstracción para manejar reseñas con estados observables
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewStateService {

  // Map para almacenar estados de diferentes entidades
  private statesMap = new Map<string, BehaviorSubject<ReviewState>>();

  constructor(
    private reservaService: ReservaService,
    private authService: AuthService
  ) {}

  /**
   * Genera una clave única para identificar el estado de una entidad
   */
  private getStateKey(entityType: 'proveedor' | 'servicio', entityId: number): string {
    return `${entityType}-${entityId}`;
  }

  /**
   * Obtiene el estado inicial por defecto
   */
  private getInitialState(): ReviewState {
    return {
      reviews: [],
      averageRating: 0,
      totalReviews: 0,
      permissions: {
        canWrite: false,
        canEdit: false,
        hasReservation: false
      },
      isLoading: true
    };
  }

  /**
   * Obtiene o crea un BehaviorSubject para una entidad específica
   */
  private getOrCreateState(key: string): BehaviorSubject<ReviewState> {
    if (!this.statesMap.has(key)) {
      this.statesMap.set(key, new BehaviorSubject<ReviewState>(this.getInitialState()));
    }
    return this.statesMap.get(key)!;
  }

  /**
   * Inicializa el estado para una entidad específica
   * Carga reseñas, rating y permisos del usuario
   */
  initializeState(config: ReviewStateConfig): Observable<ReviewState> {
    const key = this.getStateKey(config.entityType, config.entityId);
    const state$ = this.getOrCreateState(key);

    // Actualizar estado a loading
    state$.next({ ...state$.value, isLoading: true, error: undefined });

    // Cargar datos en paralelo
    const reviews$ = this.loadReviews(config);
    const rating$ = this.loadRating(config);
    const permissions$ = this.loadPermissions(config);

    return forkJoin({
      reviews: reviews$,
      rating: rating$,
      permissions: permissions$
    }).pipe(
      tap(({ reviews, rating, permissions }) => {
        state$.next({
          reviews: reviews,
          averageRating: rating,
          totalReviews: reviews.length,
          permissions: permissions,
          isLoading: false
        });
      }),
      map(() => state$.value),
      catchError((error) => {
        state$.next({
          ...state$.value,
          isLoading: false,
          error: error.message || 'Error al cargar reseñas'
        });
        return of(state$.value);
      })
    );
  }

  /**
   * Obtiene el estado observable de una entidad
   */
  getState(entityType: 'proveedor' | 'servicio', entityId: number): Observable<ReviewState> {
    const key = this.getStateKey(entityType, entityId);
    return this.getOrCreateState(key).asObservable();
  }

  /**
   * Obtiene el valor actual del estado (síncrono)
   */
  getCurrentState(entityType: 'proveedor' | 'servicio', entityId: number): ReviewState {
    const key = this.getStateKey(entityType, entityId);
    return this.getOrCreateState(key).value;
  }

  /**
   * Envía una nueva reseña o edita una existente
   */
  submitReview(config: ReviewStateConfig, reviewData: ReviewSubmission): Observable<void> {
    const key = this.getStateKey(config.entityType, config.entityId);
    const state$ = this.getOrCreateState(key);
    const currentState = state$.value;

    // Determinar si es creación o edición
    const isEdit = currentState.permissions.existingReviewId !== undefined;

    const operation$ = isEdit
      ? this.updateReview(config, currentState.permissions.existingReviewId!, reviewData)
      : this.createReview(config, reviewData);

    return operation$.pipe(
      tap(() => {
        // Recargar el estado completo después de enviar
        this.initializeState(config).subscribe();
      })
    );
  }

  /**
   * Elimina una reseña
   */
  deleteReview(config: ReviewStateConfig, reviewId: number): Observable<void> {
    const deleteOp$ = config.entityType === 'servicio'
      ? config.reviewService.deleteReviewForService(reviewId)
      : config.reviewService.deleteReviewForProvider(reviewId);

    return deleteOp$.pipe(
      tap(() => {
        // Recargar el estado después de eliminar
        this.initializeState(config).subscribe();
      })
    );
  }

  /**
   * Limpia el estado de una entidad específica
   */
  clearState(entityType: 'proveedor' | 'servicio', entityId: number): void {
    const key = this.getStateKey(entityType, entityId);
    if (this.statesMap.has(key)) {
      this.statesMap.get(key)!.next(this.getInitialState());
    }
  }

  /**
   * Limpia todos los estados
   */
  clearAllStates(): void {
    this.statesMap.forEach(state$ => state$.next(this.getInitialState()));
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Carga las reseñas de una entidad
   */
  private loadReviews(config: ReviewStateConfig): Observable<Review[]> {
    const reviews$ = config.entityType === 'servicio'
      ? config.reviewService.getAllReviewsForService(config.entityId)
      : config.reviewService.getAllReviewsForProvider(config.entityId);

    return reviews$.pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Carga el rating de una entidad
   */
  private loadRating(config: ReviewStateConfig): Observable<number> {
    const rating$ = config.entityType === 'servicio'
      ? config.reviewService.getServiceRating(config.entityId)
      : config.reviewService.getProviderRating(config.entityId);

    return rating$.pipe(
      map((response: any) => response.averageRating || 0),
      catchError(() => of(0))
    );
  }

  /**
   * Carga los permisos del usuario para escribir/editar reseñas
   */
  private loadPermissions(config: ReviewStateConfig): Observable<ReviewPermissions> {
    if (!config.userId || !config.userRole) {
      return of({
        canWrite: false,
        canEdit: false,
        hasReservation: false,
        reason: 'Usuario no autenticado'
      });
    }

    // Para proveedores, siempre pueden escribir
    if (config.userRole === 'PROVEEDOR' || config.userRole === 'Proveedor') {
      return this.checkExistingReview(config).pipe(
        map(existingReviewId => ({
          canWrite: !existingReviewId, // Solo puede escribir si no tiene una reseña
          canEdit: !!existingReviewId, // Puede editar si ya tiene una
          hasReservation: true,
          existingReviewId,
          reason: existingReviewId ? 'Puede editar su reseña existente' : 'Puede escribir una reseña'
        }))
      );
    }

    // Para turistas en servicios, verificar reserva
    if (config.entityType === 'servicio' && (config.userRole === 'TURISTA' || config.userRole === 'Turista')) {
      return this.checkReservation(config.entityId, config.userId).pipe(
        map(hasReservation => {
          if (!hasReservation) {
            return {
              canWrite: false,
              canEdit: false,
              hasReservation: false,
              reason: 'Necesitas una reserva confirmada para escribir una reseña'
            };
          }

          // Verificar si ya tiene una reseña
          return this.checkExistingReview(config).pipe(
            map(existingReviewId => ({
              canWrite: !existingReviewId,
              canEdit: !!existingReviewId,
              hasReservation: true,
              existingReviewId,
              reason: existingReviewId
                ? 'Puede editar su reseña existente'
                : 'Puede escribir una reseña (tiene reserva confirmada)'
            }))
          );
        }),
        // Aplanar el Observable anidado
        map(result => {
          if (result instanceof Observable) {
            return result;
          }
          return of(result);
        }),
        // Convertir Observable<Observable<T>> a Observable<T>
        switchMap(x => x),
        catchError(() => of({
          canWrite: false,
          canEdit: false,
          hasReservation: false,
          reason: 'Error al verificar permisos'
        }))
      );
    }

    // Para turistas en proveedores o casos no cubiertos
    return this.checkExistingReview(config).pipe(
      map(existingReviewId => ({
        canWrite: !existingReviewId,
        canEdit: !!existingReviewId,
        hasReservation: true,
        existingReviewId,
        reason: existingReviewId ? 'Puede editar su reseña existente' : 'Puede escribir una reseña'
      }))
    );
  }

  /**
   * Verifica si el usuario ya tiene una reseña para esta entidad
   */
  private checkExistingReview(config: ReviewStateConfig): Observable<number | undefined> {
    if (!config.userId) {
      return of(undefined);
    }

    const reviews$ = config.entityType === 'servicio'
      ? config.reviewService.getAllReviewsForService(config.entityId)
      : config.reviewService.getAllReviewsForProvider(config.entityId);

    return reviews$.pipe(
      map((reviews: Review[]) => {
        const userReview = reviews.find(r => r.authorId === config.userId);
        return userReview?.id;
      }),
      catchError(() => of(undefined))
    );
  }

  /**
   * Verifica si un turista tiene una reserva confirmada para un servicio
   */
  private checkReservation(servicioId: number, usuarioId: number): Observable<boolean> {
    return this.reservaService.getAll().pipe(
      map((reservas: any[]) => {
        return reservas.some(
          (reserva: any) =>
            reserva._idServicio === servicioId &&
            reserva._idTurista === usuarioId &&
            reserva.estado === 'confirmada'
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Crea una nueva reseña
   */
  private createReview(config: ReviewStateConfig, reviewData: ReviewSubmission): Observable<any> {
    return config.entityType === 'servicio'
      ? config.reviewService.createReviewForService(reviewData)
      : config.reviewService.createReviewForProvider(reviewData);
  }

  /**
   * Actualiza una reseña existente
   */
  private updateReview(config: ReviewStateConfig, reviewId: number, reviewData: ReviewSubmission): Observable<any> {
    return config.entityType === 'servicio'
      ? config.reviewService.updateReviewForService(reviewId, reviewData)
      : config.reviewService.updateReviewForProvider(reviewId, reviewData);
  }
}
