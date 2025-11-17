import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { Review } from '../ui/components/review-display/review-display.component';
import { ReviewSubmission } from '../ui/components/review-form/review-form.component';

export interface ReviewRequestDTO {
  entityId: number;
  entityType: 'SERVICE' | 'PROVIDER';
  rating: number;
  comment: string;
}

export interface ReviewResponseDTO {
  id: number;
  entityId: number;
  entityType: string;
  userId: number;
  nombre: string;
  foto: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingDTO {
  entityId: number;
  entityType: string;
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

  private getCurrentUserId(): number {
    const userId = this.authService.getCurrentUserIdSynchronous();
    if (userId == null) {
      throw new Error('User ID no disponible');
    }
    return userId;
  }

  private createHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const userId = this.authService.getCurrentUserIdSynchronous();
    if (!token || userId == null) {
      throw new Error('Token o User ID no disponibles');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': String(userId)
    });
  }

  submitReview(submission: ReviewSubmission, reviewId?: number): Observable<ReviewResponseDTO> {
    const entityTypeUpper = this.toEnglishEntityType(submission.entityType);
    const request: ReviewRequestDTO = {
      entityId: submission.entityId,
      entityType: entityTypeUpper,
      rating: submission.rating,
      comment: submission.comment
    };
    const headers = this.createHeaders();
    if (reviewId) {
      return this.http.put<ReviewResponseDTO>(`${this.API_URL}/${reviewId}`, request, { headers }).pipe(
        catchError(error => {
          console.error('Error al actualizar reseña:', error);
          return throwError(() => new Error('Error al actualizar la reseña'));
        })
      );
    } else {
      return this.http.post<ReviewResponseDTO>(this.API_URL, request, { headers }).pipe(
        catchError(error => {
          console.error('Error al crear reseña:', error);
          return throwError(() => new Error('Error al crear la reseña'));
        })
      );
    }
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${reviewId}`, { headers: this.createHeaders() }).pipe(
      catchError(error => {
        console.error('Error al eliminar reseña:', error);
        return throwError(() => new Error('Error al eliminar la reseña'));
      })
    );
  }

  getAllReviewsForEntity(entityType: 'servicio' | 'proveedor', entityId: number): Observable<Review[]> {
    const entityTypeUpper = this.toEnglishEntityType(entityType);
    const params = new HttpParams().set('page', '0').set('size', '100').set('sortBy', 'createdAt');
    return this.http.get<PagedReviewResponse>(`${this.API_URL}/entity/${entityTypeUpper}/${entityId}`, { params, headers: this.createHeaders() }).pipe(
      map(pagedResponse => pagedResponse.content.map(dto => this.mapToReview(dto))),
      catchError(() => throwError(() => new Error('Error al cargar reseñas')))
    );
  }

  getEntityRating(entityType: 'servicio' | 'proveedor', entityId: number): Observable<RatingDTO> {
    const entityTypeUpper = this.toEnglishEntityType(entityType);
    return this.http.get<RatingDTO>(`${this.API_URL}/entity/${entityTypeUpper}/${entityId}/rating`, { headers: this.createHeaders() }).pipe(
      catchError(() => throwError(() => new Error('Error al cargar rating')))
    );
  }

  /**
   * Normaliza distintos valores posibles de entityType a los esperados por el backend
   * Acepta valores en español ('servicio'|'proveedor') o en inglés ('SERVICE'|'PROVIDER') y devuelve
   * la cadena con el nombre de enum que espera el backend: 'SERVICE' o 'PROVIDER'.
   */
  private toEnglishEntityType(entityType: string): 'SERVICE' | 'PROVIDER' {
    if (!entityType) {
      throw new Error('Tipo de entidad inválido');
    }
    const t = entityType.trim().toLowerCase();
    if (t === 'servicio' || t === 'servicios' || t === 'service' || t === 'servicio') {
      return 'SERVICE';
    }
    if (t === 'proveedor' || t === 'provider' || t === 'proveedores') {
      return 'PROVIDER';
    }
    // Si viene ya en mayúsculas en inglés, intentar mapear directamente
    if (entityType === 'SERVICE' || entityType === 'PROVIDER') {
      return entityType as 'SERVICE' | 'PROVIDER';
    }
    // fallback: intentar comparar por english names
    const up = entityType.toUpperCase();
    if (up === 'SERVICE') return 'SERVICE';
    if (up === 'PROVIDER') return 'PROVIDER';

    throw new Error(`Tipo de entidad no reconocido: ${entityType}`);
  }

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

  canEditReview(review: Review): boolean {
    return review.authorId === this.getCurrentUserId();
  }

  createReviewForService(submission: ReviewSubmission): Observable<ReviewResponseDTO> {
    return this.submitReview(submission);
  }

  createReviewForProvider(submission: ReviewSubmission): Observable<ReviewResponseDTO> {
    return this.submitReview(submission);
  }

  getAllReviewsForService(serviceId: number): Observable<Review[]> {
    return this.getAllReviewsForEntity('servicio', serviceId);
  }

  getAllReviewsForProvider(providerId: number): Observable<Review[]> {
    return this.getAllReviewsForEntity('proveedor', providerId);
  }

  getServiceRating(serviceId: number): Observable<RatingDTO> {
    return this.getEntityRating('servicio', serviceId);
  }

  getProviderRating(providerId: number): Observable<RatingDTO> {
    return this.getEntityRating('proveedor', providerId);
  }
}
