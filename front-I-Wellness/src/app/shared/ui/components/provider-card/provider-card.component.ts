import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CarouselItemDirective } from '../carousel/carousel-item.directive';
import { CarouselComponent } from '../carousel/carousel.component';
import { ReviewDisplayComponent } from '../review-display/review-display.component';
import { ReviewFormComponent, ReviewSubmission } from '../review-form/review-form.component';
import { ServiceCardComponent } from '../service-card/service-card.component';

interface PlaceData {
  id: number;
  name: string;
  contactName: string;
  email: string;
  foto?: string | null;
  category: string;
  rating: number;
  totalReviews: number;
  address: string;
  hours: string;
  description: string;
  phone: string;
  companyPhone: string;
  cargoContacto: string;
  certificadosCalidad?: string[] | null;
  identificacionFiscal?: string | null;
  licenciasPermisos?: string[] | null;
}

interface Review {
  id: number;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
  helpful: number;
  notHelpful: number;
}

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
  @Input() placeData!: PlaceData;
  @Input() reviews: Review[] = [];
  @Input() services: any[] = [];

  @Output() submitReview = new EventEmitter<ReviewSubmission>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['services']) {
      console.log('Servicios actualizados en ProviderCardComponent:', this.services);
      this.cdr.markForCheck();  // Asegura que el *ngFor se actualice
    }
  }

  handleSubmitReview(reviewData: ReviewSubmission): void {
    this.submitReview.emit(reviewData);
    this.cdr.markForCheck(); // Ensure view updates after review submission
  }

  ngOnInit() {
    console.log('Servicios recibidos en ProviderCardComponent:', this.services);
  }
}
