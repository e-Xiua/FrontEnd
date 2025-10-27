import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReviewStateBuilder } from '../../../services/review-state-builder.service';
import { ReviewsCallService } from '../../../services/reviews-call.service';

export interface Review {
  id: number;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
  helpful?: number;
  notHelpful?: number;
  authorId?: number;
}

@Component({
  selector: 'app-review-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-display.component.html',
  styleUrl: './review-display.component.css'
})
export class ReviewDisplayComponent implements OnInit, OnDestroy {
  @Input() entityType: 'proveedor' | 'servicio' = 'proveedor';
  @Input() entityId!: number;
  @Input() autoLoad: boolean = true; // Si debe cargar automáticamente

  // Propiedades internas - Ya NO necesitas pasarlas desde afuera
  reviews: Review[] = [];
  averageRating: number = 0;
  totalReviews: number = 0;
  isLoading: boolean = false;
  error?: string;

  private subscription?: Subscription;

  constructor(
    private reviewStateBuilder: ReviewStateBuilder,
    private reviewsService: ReviewsCallService
  ) {}

  ngOnInit(): void {
    if (this.autoLoad && this.entityId) {
      this.loadReviews();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Carga las reseñas automáticamente usando ReviewStateBuilder
   */
  private loadReviews(): void {
    this.isLoading = true;

    this.reviewStateBuilder
      .reset()
      .forEntity(this.entityId)
      .ofType(this.entityType)
      .usingService(this.reviewsService)
      .initialize()
      .subscribe({
        next: () => {
          // Suscribirse a cambios de estado
          this.subscription = this.reviewStateBuilder.getState$().subscribe({
            next: (state) => {
              this.reviews = state.reviews;
              this.averageRating = state.averageRating;
              this.totalReviews = state.totalReviews;
              this.isLoading = state.isLoading;
              this.error = state.error;
            },
            error: (err) => {
              console.error('Error en ReviewDisplayComponent:', err);
              this.isLoading = false;
              this.error = 'Error al cargar reseñas';
            }
          });
        },
        error: (err) => {
          console.error('Error inicializando ReviewDisplayComponent:', err);
          this.isLoading = false;
          this.error = 'Error al cargar reseñas';
        }
      });
  }

  /**
   * Método público para recargar las reseñas manualmente
   */
  reload(): void {
    this.loadReviews();
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onHelpful(reviewId: number): void {
    console.log(`Marcando reseña ${reviewId} como útil`);
    // TODO: Implementar lógica para marcar como útil
  }

  onNotHelpful(reviewId: number): void {
    console.log(`Marcando reseña ${reviewId} como no útil`);
    // TODO: Implementar lógica para marcar como no útil
  }
}
