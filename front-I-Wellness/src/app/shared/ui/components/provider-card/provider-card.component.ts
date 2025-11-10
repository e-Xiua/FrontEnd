import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CarouselItemDirective } from '../carousel/carousel-item.directive';
import { CarouselComponent } from '../carousel/carousel.component';
import { ReviewDisplayComponent } from '../review-display/review-display.component';
import { ReviewFormComponent, ReviewSubmission } from '../review-form/review-form.component';
import { ServiceCardComponent } from '../service-card/service-card.component';
import { ExtendedPlaceData } from '../../../models/place-data.model';

@Component({
  selector: 'app-provider-card',
  imports: [
    ServiceCardComponent,
    CarouselComponent,
    CarouselItemDirective,
    FormsModule,
    CommonModule,
    ReviewDisplayComponent,
    ReviewFormComponent
  ],
  templateUrl: './provider-card.component.html',
  styleUrl: './provider-card.component.css',
  standalone: true
})
export class ProviderCardComponent implements OnChanges {
  @Input() placeData!: ExtendedPlaceData;

  @Output() submitReview = new EventEmitter<ReviewSubmission>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['placeData']) {
      console.log('=== 📊 PROVIDER CARD - RECEIVED PLACE DATA ===');
      console.log('Provider ID:', this.placeData.id);
      console.log('Provider Name:', this.placeData.name);
      console.log('Contact Details:', {
        contactName: this.placeData.contactName,
        cargoContacto: this.placeData.cargoContacto,
        phone: this.placeData.phone,
        companyPhone: this.placeData.companyPhone,
        email: this.placeData.email
      });
      console.log('Business Metrics:', {
        averageCost: this.placeData.averageCost,
        averageVisitDuration: this.placeData.averageVisitDuration,
        servicesCount: this.placeData.services?.length || 0,
        categoriesCount: this.placeData.categories?.length || 0
      });
      console.log('Categories:', this.placeData.categories);
      console.log('Full PlaceData:', this.placeData);
      console.log('=============================================');
      this.cdr.markForCheck();
    }
  }

  handleSubmitReview(reviewData: ReviewSubmission): void {
    this.submitReview.emit(reviewData);
    this.cdr.markForCheck();
  }

  ngOnInit() {
    console.log('ProviderCardComponent initialized with data:', this.placeData);
  }

  /**
   * Check if contact information is available and valid
   */
  hasValidContactInfo(): boolean {
    return !!(
      (this.placeData.contactName && this.placeData.contactName !== 'N/A') ||
      (this.placeData.phone && this.placeData.phone !== 'N/A') ||
      (this.placeData.companyPhone && this.placeData.companyPhone !== 'N/A') ||
      (this.placeData.email && this.placeData.email !== 'N/A')
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
    return this.placeData.category || 'N/A';
  }

  /**
   * Check if services are available
   */
  hasServices(): boolean {
    return !!(this.placeData.services && this.placeData.services.length > 0);
  }
}
