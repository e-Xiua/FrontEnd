import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CarouselItemDirective } from '../carousel/carousel-item.directive';
import { CarouselComponent } from '../carousel/carousel.component';
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
  imports: [ServiceCardComponent, CarouselComponent, CarouselItemDirective, FormsModule, CommonModule],
  templateUrl: './provider-card.component.html',
  styleUrl: './provider-card.component.css',
  standalone: true
})
export class ProviderCardComponent implements OnChanges {
  @Input() placeData!: PlaceData;
  @Input() reviews: Review[] = [];
  @Input() services: any[] = [];

  userRating: number = 0;
  userReview: string = '';

  @Output() submitReview = new EventEmitter<{ rating: number, review: string }>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['services']) {
      console.log('Servicios actualizados en ProviderCardComponent:', this.services);
      this.cdr.markForCheck();  // Asegura que el *ngFor se actualice
    }
  }

  handleSubmitReview(): void {
    if (this.userRating > 0 && this.userReview.trim()) {
      this.submitReview.emit({
        rating: this.userRating,
        review: this.userReview
      });
      this.userRating = 0;
      this.userReview = '';
      this.cdr.markForCheck(); // Ensure view updates after resetting
    }
  }

  setUserRating(rating: number): void {
    this.userRating = rating;
    this.cdr.markForCheck(); // Ensure view updates after rating change
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  ngOnInit() {
    console.log('Servicios recibidos en ProviderCardComponent:', this.services);
  }
}
