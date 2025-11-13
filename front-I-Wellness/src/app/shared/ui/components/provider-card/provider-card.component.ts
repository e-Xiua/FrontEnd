import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ExtendedPlaceData, placeDataDefaults } from '../../../models/place-data.model';
import { ReviewsCallService } from '../../../services/reviews-call.service';
import { ServiceCardComponent } from '../service-card/service-card.component';

@Component({
  selector: 'app-provider-card',
  imports: [
    ServiceCardComponent,
    FormsModule,
    CommonModule
  ],
  templateUrl: './provider-card.component.html',
  styleUrl: './provider-card.component.css',
  standalone: true
})
export class ProviderCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() placeData!: ExtendedPlaceData;

  @Output() submitReview = new EventEmitter<any>();

  // Defaults available to template
  readonly defaults = placeDataDefaults;
  
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private reviewsService: ReviewsCallService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['placeData']) {
      console.groupCollapsed('=== 📊 PROVIDER CARD DATA (ID:' + this.placeData.id + ') ===');
      console.log('Name:', this.placeData.name);
      console.log('Rating (initial):', {
        rating: this.placeData.rating,
        totalReviews: this.placeData.totalReviews
      });
      console.log('Contact:', {
        contactName: this.placeData.contactName,
        cargoContacto: this.placeData.cargoContacto,
        phone: this.placeData.phone,
        companyPhone: this.placeData.companyPhone,
        correo: this.placeData.correo
      });
      console.log('Metrics:', {
        averageCost: this.placeData.averageCost,
        averageVisitDuration: this.placeData.averageVisitDuration,
        servicesCount: this.placeData.services?.length || 0,
        categoriesCount: this.placeData.categories?.length || 0
      });
      console.log('Categories:', this.placeData.categories);
      if (this.placeData.services && this.placeData.services.length) {
        console.log('[ProviderCard] Services length:', this.placeData.services.length);
        console.log('[ProviderCard] First service sample:', this.placeData.services[0]);
        if (this.placeData.services.length > 1) {
          console.log('[ProviderCard] Second service sample:', this.placeData.services[1]);
        }
      } else {
        console.log('[ProviderCard] No services available (services array empty or undefined).');
      }
      console.log('Full PlaceData:', this.placeData);
      console.groupEnd();
      
      // Cargar rating real desde el backend
      if (this.placeData?.id) {
        this.loadProviderRating(this.placeData.id);
      }
      
      this.cdr.markForCheck();
    }
  }

  ngOnInit() {
    console.groupCollapsed('ProviderCardComponent init');
    console.log('Initial data:', this.placeData);
    console.groupEnd();
    
    // Cargar rating si ya tenemos los datos
    if (this.placeData?.id) {
      this.loadProviderRating(this.placeData.id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el rating real del proveedor desde la API de reviews
   */
  private loadProviderRating(providerId: number): void {
    console.log('🌟 [ProviderCard] Cargando rating para proveedor ID:', providerId);
    
    this.reviewsService.getProviderRating(providerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rating) => {
          console.log('✅ [ProviderCard] Rating cargado:', rating);
          
          // Actualizar el placeData con el rating obtenido
          if (this.placeData) {
            this.placeData.rating = this.parseRatingValue(rating.averageRating);
            this.placeData.totalReviews = rating.totalReviews;
            console.log('📊 [ProviderCard] Rating actualizado:', {
              rating: this.placeData.rating,
              totalReviews: this.placeData.totalReviews
            });
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('❌ [ProviderCard] Error al cargar rating:', error);
          // Mantener valores por defecto si falla
          if (this.placeData) {
            this.placeData.rating = 0;
            this.placeData.totalReviews = 0;
            this.cdr.markForCheck();
          }
        }
      });
  }

  /**
   * Parsea el valor de rating que puede venir como objeto {source, parsedValue} o número
   */
  private parseRatingValue(rating: any): number {
    if (typeof rating === 'number') {
      return rating;
    }
    if (rating && typeof rating === 'object' && 'parsedValue' in rating) {
      return rating.parsedValue;
    }
    return 0;
  }

  /**
   * Navigate to service details page
   */
  navigateToService(serviceId: number): void {
    if (serviceId) {
      console.log('Navegando a servicio:', serviceId);
      this.router.navigate(['/infoservicio', serviceId]);
    } else {
      console.error('No se proporcionó un ID de servicio válido');
    }
  }

  /**
   * Navigate to provider's full profile
   */
  viewFullProfile(): void {
    if (this.placeData?.id) {
      console.log('Navegando a perfil completo del proveedor:', this.placeData.id);
      // Determinar la ruta según el tipo de usuario
      // Por ahora asumimos que es desde vista de turista
      this.router.navigate(['/turista/perfil-proveedor', this.placeData.id]);
    }
  }

  /**
   * Check if contact information is available and valid
   */
  hasValidContactInfo(): boolean {
    return !!(
      this.placeData?.contactName ||
      this.placeData?.phone ||
      this.placeData?.companyPhone ||
      this.placeData?.correo
    );
  }

  /**
   * Check if business metrics are available and realistic
   */
  hasValidMetrics(): boolean {
    return !!(
      (this.placeData.averageCost && this.placeData.averageCost < 999999) ||
      this.placeData.averageVisitDuration
    );
  }

  /**
   * Get formatted price string
   */
  getFormattedPrice(): string | null {
    if (this.placeData.averageCost && this.placeData.averageCost < 999999) {
      return `$${this.placeData.averageCost.toFixed(2)}`;
    }
    return null;
  }

  /**
   * Get categories as a comma-separated string
   */
  getCategoriesString(): string {
    if (this.placeData.categories && this.placeData.categories.length > 0) {
      return this.placeData.categories.join(', ');
    }
    return this.placeData.category || this.defaults.category;
  }

  /**
   * Check if services are available
   */
  hasServices(): boolean {
    return !!(this.placeData.services && this.placeData.services.length > 0);
  }
}
