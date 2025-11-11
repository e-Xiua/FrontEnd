import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ProviderServiceListItem {
  _idServicio: number;
  nombre: string;
  descripcion: string;
  precio: number | null;
  imagen: string;
  estado: boolean;
}

export interface ProviderServiceListToggleEvent {
  service: ProviderServiceListItem;
  checked: boolean;
}

@Component({
  selector: 'app-provider-service-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-service-list.component.html',
  styleUrl: './provider-service-list.component.css'
})
export class ProviderServiceListComponent {
  @Input() title = 'Aquí está tu lista de servicios:';
  @Input() services: ProviderServiceListItem[] = [];
  @Input() isLoading = false;
  @Input() emptyMessage = 'Aún no tienes servicios creados.';

  @Output() create = new EventEmitter<void>();
  @Output() view = new EventEmitter<number>();
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<ProviderServiceListItem>();
  @Output() toggleState = new EventEmitter<ProviderServiceListToggleEvent>();

  trackByServiceId(_index: number, servicio: ProviderServiceListItem): number {
    return servicio._idServicio;
  }

  handleToggle(event: Event, service: ProviderServiceListItem): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }
    this.toggleState.emit({ service, checked: input.checked });
  }
}
