import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ReviewStateBuilder } from '../../../services/review-state-builder.service';
import { ReviewsCallService } from '../../../services/reviews-call.service';

export interface ReviewSubmission {
  entityId: number;
  entityType: 'proveedor' | 'servicio';
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-form.component.html',
  styleUrl: './review-form.component.css'
})
export class ReviewFormComponent implements OnInit, OnDestroy {
  @Input() entityType: 'proveedor' | 'servicio' = 'proveedor';
  @Input() entityId!: number;
  @Input() autoCheck: boolean = true; // Si debe verificar permisos automáticamente
  @Output() reviewSubmitted = new EventEmitter<ReviewSubmission>();

  // Estado interno
  rating: number = 0;
  hoverRating: number = 0;
  comment: string = '';
  isSubmitting: boolean = false;
  errorMessage: string = '';

  // Permisos y estado
  canWrite: boolean = false;
  canEdit: boolean = false;
  existingReviewId?: number;
  hasPermissions: boolean = false;
  permissionMessage: string = '';
  isCheckingPermissions: boolean = false;

  stars: number[] = [1, 2, 3, 4, 5];

  private subscription?: Subscription;
  private currentUserId?: number;
  private currentUserRole?: string;

  constructor(
    private reviewStateBuilder: ReviewStateBuilder,
    private reviewsService: ReviewsCallService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.autoCheck && this.entityId) {
      this.checkPermissions();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Verifica automáticamente si el usuario puede escribir o editar reseñas
   */
  private checkPermissions(): void {
    this.isCheckingPermissions = true;

    // Obtener usuario actual
    this.authService.usuarioHome().subscribe({
      next: (usuario) => {
        const currentUser = JSON.parse(usuario);
        this.currentUserId = currentUser.id;
        this.currentUserRole = localStorage.getItem('rol') || undefined;

        // Inicializar estado de reviews
        let builder = this.reviewStateBuilder
          .reset()
          .forEntity(this.entityId)
          .ofType(this.entityType)
          .usingService(this.reviewsService);

        if (this.currentUserId) {
          builder = builder.withUser(this.currentUserId);
        }

        if (this.currentUserRole) {
          builder = builder.withRole(this.currentUserRole);
        }

        builder.initialize()
          .subscribe({
            next: () => {
              // Suscribirse a cambios de estado
              this.subscription = this.reviewStateBuilder.getState$().subscribe({
                next: (state) => {
                  this.canWrite = state.permissions.canWrite;
                  this.canEdit = state.permissions.canEdit;
                  this.existingReviewId = state.permissions.existingReviewId;
                  this.hasPermissions = state.permissions.canWrite || state.permissions.canEdit;
                  this.permissionMessage = state.permissions.reason || '';
                  this.isCheckingPermissions = false;

                  // Si puede editar, pre-llenar el formulario
                  if (this.canEdit && state.permissions.existingReviewId) {
                    const existingReview = state.reviews.find(r => r.id === state.permissions.existingReviewId);
                    if (existingReview) {
                      this.rating = existingReview.rating;
                      this.comment = existingReview.comment;
                    }
                  }
                },
                error: (err) => {
                  console.error('Error en ReviewFormComponent:', err);
                  this.isCheckingPermissions = false;
                  this.hasPermissions = false;
                  this.permissionMessage = 'Error al verificar permisos';
                }
              });
            },
            error: (err) => {
              console.error('Error inicializando ReviewFormComponent:', err);
              this.isCheckingPermissions = false;
              this.hasPermissions = false;
              this.permissionMessage = 'Error al verificar permisos';
            }
          });
      },
      error: (err) => {
        console.error('Error obteniendo usuario:', err);
        this.isCheckingPermissions = false;
        this.hasPermissions = false;
        this.permissionMessage = 'Debes iniciar sesión para escribir una reseña';
      }
    });
  }

  setRating(rating: number): void {
    this.rating = rating;
    this.errorMessage = '';
  }

  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  clearHoverRating(): void {
    this.hoverRating = 0;
  }

  isStarFilled(star: number): boolean {
    return star <= (this.hoverRating || this.rating);
  }

  onSubmit(): void {
    // Validation
    if (this.rating === 0) {
      this.errorMessage = 'Por favor, selecciona una calificación.';
      return;
    }

    if (!this.comment || this.comment.trim().length === 0) {
      this.errorMessage = 'Por favor, escribe un comentario.';
      return;
    }

    if (this.comment.trim().length < 10) {
      this.errorMessage = 'El comentario debe tener al menos 10 caracteres.';
      return;
    }

    if (this.comment.trim().length > 1000) {
      this.errorMessage = 'El comentario no puede exceder los 1000 caracteres.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const reviewData: ReviewSubmission = {
      entityId: this.entityId,
      entityType: this.entityType,
      rating: this.rating,
      comment: this.comment.trim()
    };

    // Usar ReviewStateBuilder para enviar (detecta automáticamente create vs edit)
    let builder = this.reviewStateBuilder
      .reset()
      .forEntity(this.entityId)
      .ofType(this.entityType)
      .usingService(this.reviewsService);

    if (this.currentUserId) {
      builder = builder.withUser(this.currentUserId);
    }

    if (this.currentUserRole) {
      builder = builder.withRole(this.currentUserRole);
    }

    builder.submitReview(reviewData).subscribe({
      next: () => {
        const action = this.canEdit ? 'actualizada' : 'publicada';

        Swal.fire({
          icon: 'success',
          title: `¡Reseña ${action}!`,
          text: `Tu opinión ha sido ${action} exitosamente.`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#4a9c9f'
        });

        this.reviewSubmitted.emit(reviewData);

        // Reset form after submission
        setTimeout(() => {
          this.resetForm();
          // Recargar permisos para actualizar el estado
          if (this.autoCheck) {
            this.checkPermissions();
          }
        }, 500);
      },
      error: (error) => {
        console.error('Error al enviar reseña:', error);
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo publicar tu reseña.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#4a9c9f'
        });
      }
    });
  }

  resetForm(): void {
    this.rating = 0;
    this.hoverRating = 0;
    this.comment = '';
    this.isSubmitting = false;
    this.errorMessage = '';
  }

  getCharacterCount(): number {
    return this.comment.length;
  }

  getRemainingCharacters(): number {
    return 1000 - this.comment.length;
  }

  isFormValid(): boolean {
    return (
      this.rating > 0 &&
      this.comment.trim().length >= 10 &&
      this.comment.trim().length <= 1000
    );
  }
}
