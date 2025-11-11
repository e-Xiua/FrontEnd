import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface ProviderServiceFormModel {
  _idProveedor: number;
  nombre: string;
  descripcion: string;
  precio: number | null;
  imagen: string;
  horario: string;
  estado: boolean;
  tiempoAproximado: number | null;
}

export interface ProviderServiceDay {
  name: string;
  selected: boolean;
}

export interface ProviderPreferenceOption {
  _idPreferencias: number;
  nombre: string;
}

@Component({
  selector: 'app-provider-service-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-service-form.component.html',
  styleUrl: './provider-service-form.component.css'
})
export class ProviderServiceFormComponent {
  @Input() service: ProviderServiceFormModel | null = null;
  @Input() days: ProviderServiceDay[] = [];
  @Input() startTime = '';
  @Input() endTime = '';
  @Input() imagePreview: string | null = null;
  @Input() preferences: ProviderPreferenceOption[] = [];
  @Input() selectedPreferences: number[] = [];
  @Input() minPreferences = 2;
  @Input() maxPreferences = 5;
  @Input() disableSubmit = false;

  @Output() nombreChange = new EventEmitter<string>();
  @Output() descripcionChange = new EventEmitter<string>();
  @Output() precioChange = new EventEmitter<number | null>();
  @Output() tiempoAproximadoChange = new EventEmitter<number | null>();
  @Output() daySelectionChange = new EventEmitter<{ index: number; selected: boolean }>();
  @Output() startTimeChange = new EventEmitter<string>();
  @Output() endTimeChange = new EventEmitter<string>();
  @Output() preferenceToggle = new EventEmitter<{ id: number; checked: boolean }>();
  @Output() imageSelected = new EventEmitter<Event>();
  @Output() submitForm = new EventEmitter<void>();

  trackByDayName(index: number, day: ProviderServiceDay): string {
    return day.name;
  }

  onPrecioInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? null;
    this.precioChange.emit(this.parseNumeric(value));
  }

  onTiempoAproximadoInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? null;
    this.tiempoAproximadoChange.emit(this.parseNumeric(value));
  }

  onDayChange(index: number, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.daySelectionChange.emit({ index, selected: checked });
  }

  onStartTimeChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.startTimeChange.emit(value);
  }

  onEndTimeChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.endTimeChange.emit(value);
  }

  onPreferenceChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.preferenceToggle.emit({ id, checked });
  }

  isPreferenceChecked(id: number): boolean {
    return this.selectedPreferences.includes(id);
  }

  isPreferenceDisabled(id: number): boolean {
    return !this.isPreferenceChecked(id) && this.selectedPreferences.length >= this.maxPreferences;
  }

  parseNumeric(value: string | null | undefined): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
