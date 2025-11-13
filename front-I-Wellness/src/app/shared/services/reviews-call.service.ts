import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { Review } from '../ui/components/review-display/review-display.component';
import { ReviewSubmission } from '../ui/components/review-form/review-form.component';

// DTOs que coinciden con el backend
export interface ReviewRequestDTO {
  serviceId: number;
  rating: number;
  comment: string;
}

export interface ProviderReviewRequestDTO {
  providerId: number;
  rating: number;
  comment: string;
}

export interface ReviewResponseDTO {
  id: number;
  serviceId: number;
  userId: number;
  nombre: string;
  foto: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRatingDTO {
  serviceId: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export interface ProviderRatingDTO {
  providerId: number;
  averageRating: number;
  totalReviews: number;
  distribution: {
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
  };
}

export interface PagedReviewResponse {
  content: ReviewResponseDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsCallService {
  private readonly API_URL = 'http://localhost:8084/api/reviews';

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Obtiene el ID del usuario actual del localStorage
   */

  private getCurrentUserId(): number {
    const userId = this.authService.getCurrentUserIdSynchronous();

    console.log('User ID obtenido para ConversationApiService:', userId);

    if (userId == null) {
      throw new Error('User ID no disponible para la petición de API');
    }

    return userId;
  }
  private createHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const userId = this.authService.getCurrentUserIdSynchronous();

    console.log('User ID obtenido para ConversationApiService:', userId);
    if (!token || userId == null) {
      throw new Error('Token o User ID no disponibles para la petición de API');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-User-Id': String(userId)
    });
  }

  /**
   * Crea una nueva reseña para un servicio
   */
  createReviewForService(submission: ReviewSubmission): Observable<ReviewResponseDTO> {
    if (submission.entityType !== 'servicio') {
      return throwError(() => new Error('Este método solo acepta reseñas de servicios'));
    }

    const request: ReviewRequestDTO = {
      serviceId: submission.entityId,
      rating: submission.rating,
      comment: submission.comment
    };

    return this.http.post<ReviewResponseDTO>(
      this.API_URL,
      request,
      { headers: this.createHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al crear reseña:', error);
        if (error.status === 409) {
          return throwError(() => new Error('Ya has publicado una reseña para este servicio'));
        }
        return throwError(() => new Error('Error al crear la reseña. Intenta de nuevo.'));
      })
    );
  }

  /**
   * Actualiza una reseña existente
   */
  updateReview(reviewId: number, submission: ReviewSubmission): Observable<ReviewResponseDTO> {
    const request: ReviewRequestDTO = {
      serviceId: submission.entityId,
      rating: submission.rating,
      comment: submission.comment
    };

    return this.http.put<ReviewResponseDTO>(
      `${this.API_URL}/${reviewId}`,
      request,
      { headers: this.createHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al actualizar reseña:', error);
        if (error.status === 403) {
          return throwError(() => new Error('No tienes permiso para editar esta reseña'));
        }
        return throwError(() => new Error('Error al actualizar la reseña. Intenta de nuevo.'));
      })
    );
  }

  /**
   * Elimina una reseña
   */
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${reviewId}`,
      { headers: this.createHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar reseña:', error);
        if (error.status === 403) {
          return throwError(() => new Error('No tienes permiso para eliminar esta reseña'));
        }
        return throwError(() => new Error('Error al eliminar la reseña. Intenta de nuevo.'));
      })
    );
  }

  /**
   * Obtiene una reseña por ID
   */
  getReviewById(reviewId: number): Observable<Review> {
    return this.http.get<ReviewResponseDTO>(`${this.API_URL}/${reviewId}`, { headers: this.createHeaders() })
      .pipe(
        map(dto => this.mapToReview(dto)),
        catchError(error => {
          console.error('Error al obtener reseña:', error);
          return throwError(() => new Error('Error al cargar la reseña'));
        })
      );
  }

  /**
   * Obtiene todas las reseñas de un servicio con paginación
   */
  getReviewsByService(
    serviceId: number,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'createdAt'
  ): Observable<PagedReviewResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);

    return this.http.get<PagedReviewResponse>(
      `${this.API_URL}/service/${serviceId}`,
      { params , headers: this.createHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener reseñas del servicio:', error);
        return throwError(() => new Error('Error al cargar las reseñas'));
      })
    );
  }

  /**
   * Obtiene todas las reseñas de un servicio (sin paginación) para mostrar en componentes
   */
  getAllReviewsForService(serviceId: number): Observable<Review[]> {
    // Obtenemos todas las reseñas con un tamaño grande
    return this.getReviewsByService(serviceId, 0, 100)
      .pipe(
        map(pagedResponse => pagedResponse.content.map(dto => this.mapToReview(dto)))
      );
  }

  /**
   * Obtiene todas las reseñas de un proveedor (sin paginación)
   */
  getAllReviewsForProvider(providerId: number): Observable<Review[]> {
    return this.getReviewsByProvider(providerId, 0, 100)
      .pipe(
        map(pagedResponse => pagedResponse.content.map(dto => this.mapToReview(dto)))
      );
  }

  /**
   * Obtiene todas las reseñas de un proveedor con paginación
   */
  getReviewsByProvider(
    providerId: number,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'createdAt'
  ): Observable<PagedReviewResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);

    return this.http.get<PagedReviewResponse>(
      `${this.API_URL}/provider/${providerId}`,
      { params , headers: this.createHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener reseñas del proveedor:', error);
        return throwError(() => new Error('Error al cargar las reseñas del proveedor'));
      })
    );
  }

  /**
   * Obtiene el rating promedio de un proveedor
   */
  getProviderRating(providerId: number): Observable<ProviderRatingDTO> {
    return this.http.get<ProviderRatingDTO>(`${this.API_URL}/provider/${providerId}/rating`, { headers: this.createHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error al obtener rating del proveedor:', error);
          return throwError(() => new Error('Error al cargar el rating del proveedor'));
        })
      );
  }

    /**
   * Crea una reseña para un proveedor
   */
  createReviewForProvider(submission: ReviewSubmission): Observable<ReviewResponseDTO> {
    if (submission.entityType !== 'proveedor') {
      return throwError(() => new Error('Este método solo acepta reseñas de proveedores'));
    }

    const request: ProviderReviewRequestDTO = {
      providerId: submission.entityId,
      rating: submission.rating,
      comment: submission.comment
    };

    return this.http.post<ReviewResponseDTO>(
      `${this.API_URL}/provider`,
      request,
      { headers: this.createHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error al crear reseña de proveedor:', error);
        if (error.status === 409) {
          return throwError(() => new Error('Ya has escrito una reseña para este proveedor'));
        }
        return throwError(() => new Error('Error al crear la reseña del proveedor. Intenta de nuevo.'));
      })
    );
  }

  /**
   * Actualiza una reseña de servicio
   * Wrapper específico para servicios
   */
  updateReviewForService(reviewId: number, submission: ReviewSubmission): Observable<ReviewResponseDTO> {
    return this.updateReview(reviewId, submission);
  }

  /**
   * Actualiza una reseña de proveedor
   */
  updateReviewForProvider(reviewId: number, submission: ReviewSubmission): Observable<ReviewResponseDTO> {
    // El backend usa el mismo endpoint para actualizar reseñas de servicios y proveedores
    return this.updateReview(reviewId, submission);
  }

  /**
   * Elimina una reseña de servicio
   */
  deleteReviewForService(reviewId: number): Observable<void> {
    return this.deleteReview(reviewId);
  }

  /**
   * Elimina una reseña de proveedor
   */
  deleteReviewForProvider(reviewId: number): Observable<void> {
    // El backend usa el mismo endpoint para eliminar reseñas de servicios y proveedores
    return this.deleteReview(reviewId);
  }

  /**
   * Obtiene las reseñas más recientes de un proveedor
   */
  getRecentProviderReviews(providerId: number, limit: number = 5): Observable<Review[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<ReviewResponseDTO[]>(
      `${this.API_URL}/provider/${providerId}/recent`,
      { params, headers: this.createHeaders() }
    ).pipe(
      map(dtos => dtos.map(dto => this.mapToReview(dto))),
      catchError(error => {
        console.error('Error al obtener reseñas recientes del proveedor:', error);
        return throwError(() => new Error('Error al cargar las reseñas recientes'));
      })
    );
  }

  /**
   * Obtiene todas las reseñas de un usuario
   */
  getReviewsByUser(userId: number, page: number = 0, size: number = 10): Observable<PagedReviewResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedReviewResponse>(
      `${this.API_URL}/user/${userId}`,
      { params, headers: this.createHeaders()}
    ).pipe(
      catchError(error => {
        console.error('Error al obtener reseñas del usuario:', error);
        return throwError(() => new Error('Error al cargar las reseñas del usuario'));
      })
    );
  }

  /**
   * Obtiene las estadísticas de calificación de un servicio
   */
  getServiceRating(serviceId: number): Observable<ServiceRatingDTO> {
    return this.http.get<ServiceRatingDTO>(`${this.API_URL}/service/${serviceId}/rating`,  { headers: this.createHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error al obtener calificación del servicio:', error);
          return throwError(() => new Error('Error al cargar la calificación'));
        })
      );
  }

  /**
   * Obtiene las reseñas más recientes de un servicio
   */
  getRecentReviews(serviceId: number, limit: number = 5): Observable<Review[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<ReviewResponseDTO[]>(
      `${this.API_URL}/service/${serviceId}/recent`,
      { params, headers: this.createHeaders() }
    ).pipe(
      map(dtos => dtos.map(dto => this.mapToReview(dto))),
      catchError(error => {
        console.error('Error al obtener reseñas recientes:', error);
        return throwError(() => new Error('Error al cargar las reseñas recientes'));
      })
    );
  }

  /**
   * Mapea ReviewResponseDTO a Review (formato del componente)
   */
  private mapToReview(dto: ReviewResponseDTO): Review {
    return {
      id: dto.id,
      nombre: dto.nombre || 'Usuario',
      foto: dto.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dto.userId}`,
      date: dto.createdAt,
      rating: dto.rating,
      comment: dto.comment || '',
      authorId: dto.userId
    };
  }

  /**
   * Verifica si el usuario actual puede editar una reseña
   */
  canEditReview(review: Review): boolean {
    const currentUserId = this.getCurrentUserId();
    return review.authorId === currentUserId;
  }

  /**
   * Verifica si el usuario ya tiene una reseña para un servicio
   * (Se puede hacer en el backend, pero aquí está la lógica del frontend)
   */
  userHasReviewForService(serviceId: number): Observable<boolean> {
    const currentUserId = this.getCurrentUserId();
    return this.getReviewsByUser(currentUserId, 0, 100)
      .pipe(
        map(pagedResponse =>
          pagedResponse.content.some(review => review.serviceId === serviceId)
        ),
        catchError(() => {
          // En caso de error, asumimos que no tiene reseña
          return throwError(() => false);
        })
      );
  }
}
