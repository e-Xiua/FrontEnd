import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-card',
  imports: [CommonModule],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.css'
})
export class ServiceCardComponent {
  @Input() id!: number; // ID del servicio para la navegación
  @Input() image: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() schedule: string = '';
  @Input() price: string = '';
  @Input() duration?: string;

  constructor(private router: Router) {}

  verServicio(): void {
    if (this.id) {
      this.router.navigate(['/infoservicio', this.id]);
    } else {
      console.error('No se proporcionó un ID de servicio válido');
    }
  }
}
