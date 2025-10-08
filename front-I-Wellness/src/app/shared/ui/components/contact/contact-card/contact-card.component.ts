import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ChatProvider } from '../../../../models/chat';
import { AnimationContext } from '../../../../services/animation-strategy.service';

@Component({
  selector: 'app-contact-card',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatChipsModule, MatCardModule],
  templateUrl: './contact-card.component.html',
  styleUrl: './contact-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ContactCardComponent {
  @Input({ required: true }) provider!: ChatProvider;
  @Input() isSelected: boolean = false;
  @Input() animationClass: string = '';
  @Input() showServices: boolean = true;
  @Input() compactMode: boolean = false;

  @Output() cardClick = new EventEmitter<ChatProvider>();
  @Output() chatClick = new EventEmitter<ChatProvider>();
  @Output() profileClick = new EventEmitter<ChatProvider>();

  constructor(
    private router: Router,
    private animationContext: AnimationContext
  ) {}

  onCardClick(): void {
    this.cardClick.emit(this.provider);
  }

  onChatClick(event: Event): void {
    event.stopPropagation();
    this.chatClick.emit(this.provider);
  }

  onProfileClick(event: Event): void {
    event.stopPropagation();
    this.profileClick.emit(this.provider);
  }

  get statusText(): string {
    if (this.provider.isOnline) {
      return 'En línea';
    }

    if (this.provider.lastSeen) {
      const now = new Date();
      const lastSeen = new Date(this.provider.lastSeen);
      const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

      if (diffMinutes < 60) {
        return `Hace ${diffMinutes} min`;
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        return `Hace ${hours}h`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        return `Hace ${days}d`;
      }
    }

    return 'Desconectado';
  }

  get ratingStars(): string[] {
    const rating = this.provider.rating;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('star');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('star_half');
      } else {
        stars.push('star_border');
      }
    }

    return stars;
  }

  get visibleServices() {
    return this.compactMode
      ? this.provider.services.slice(0, 2)
      : this.provider.services.slice(0, 3);
  }

  get hasMoreServices(): boolean {
    const maxVisible = this.compactMode ? 2 : 3;
    return this.provider.services.length > maxVisible;
  }

  get moreServicesCount(): number {
    const maxVisible = this.compactMode ? 2 : 3;
    return Math.max(0, this.provider.services.length - maxVisible);
  }

  formatPrice(price: number, currency: string): string {
    if (currency === 'CRC') {
      return `₡${price.toLocaleString()}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  }

  getServiceIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'tour': 'tour',
      'transport': 'directions_car',
      'accommodation': 'hotel',
      'restaurant': 'restaurant',
      'activity': 'local_activity',
      'guide': 'person',
      'equipment': 'sports_handball',
      'photography': 'photo_camera',
      'spa': 'spa',
      'adventure': 'terrain',
      'culture': 'museum',
      'nature': 'park',
      'water': 'pool',
      'mountain': 'landscape',
      'beach': 'beach_access',
      'wildlife': 'pets',
      'default': 'room_service'
    };

    return iconMap[category.toLowerCase()] || iconMap['default'];
  }
}
