import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { PreferenciasService } from '../../../../features/preferencias/services/preferencias/preferencias.service';
import { ServicioXPreferenciaService } from '../../../../features/preferencias/services/servicioXpreferencias/servicio-xpreferencia.service';
import { ServicioService } from '../../../../features/servicios/services/servicio.service';
import {
  ProviderPreferenceOption,
  ProviderServiceDay,
  ProviderServiceFormComponent,
  ProviderServiceFormModel
} from './provider-service-form.component';

@Component({
  selector: 'app-provider-service-form-container',
  standalone: true,
  imports: [CommonModule, ProviderServiceFormComponent],
  template: `
    <app-provider-service-form
      [service]="serviceDraft"
      [days]="days"
      [startTime]="startTime"
      [endTime]="endTime"
      [imagePreview]="imagePreview"
      [preferences]="preferences"
      [selectedPreferences]="selectedPreferences"
      [minPreferences]="MIN_PREFERENCES"
      [maxPreferences]="MAX_PREFERENCES"
      [disableSubmit]="isSubmitting"
      (nombreChange)="updateNombre($event)"
      (descripcionChange)="updateDescripcion($event)"
      (precioChange)="updatePrecio($event)"
      (tiempoAproximadoChange)="updateTiempoAproximado($event)"
      (daySelectionChange)="onDaySelectionChange($event)"
      (startTimeChange)="startTime = $event"
      (endTimeChange)="endTime = $event"
      (preferenceToggle)="onPreferenceToggle($event)"
      (imageSelected)="onImageSelected($event)"
      (submitForm)="guardarServicio()"
    ></app-provider-service-form>
  `
})
export class ProviderServiceFormContainerComponent implements OnInit {
  readonly MIN_PREFERENCES = 2;
  readonly MAX_PREFERENCES = 5;

  serviceDraft: ProviderServiceFormModel = {
    _idProveedor: 0,
    nombre: '',
    descripcion: '',
    precio: null,
    imagen: '',
    horario: '',
    estado: true,
    tiempoAproximado: null
  };

  days: ProviderServiceDay[] = [
    { name: 'Lunes', selected: false },
    { name: 'Martes', selected: false },
    { name: 'Miércoles', selected: false },
    { name: 'Jueves', selected: false },
    { name: 'Viernes', selected: false },
    { name: 'Sábado', selected: false },
    { name: 'Domingo', selected: false }
  ];

  startTime = '';
  endTime = '';
  imagePreview: string | null = null;
  preferences: ProviderPreferenceOption[] = [];
  selectedPreferences: number[] = [];
  isSubmitting = false;

  constructor(
    private readonly router: Router,
    private readonly servicioService: ServicioService,
    private readonly authService: AuthService,
    private readonly preferenciasService: PreferenciasService,
    private readonly servicioXPreferencia: ServicioXPreferenciaService
  ) {}

  ngOnInit(): void {
    this.cargarPreferencias();
    this.establecerProveedor();
  }

  updateNombre(nombre: string): void {
    this.serviceDraft = { ...this.serviceDraft, nombre };
  }

  updateDescripcion(descripcion: string): void {
    this.serviceDraft = { ...this.serviceDraft, descripcion };
  }

  updatePrecio(precio: number | null): void {
    this.serviceDraft = { ...this.serviceDraft, precio };
  }

  updateTiempoAproximado(tiempo: number | null): void {
    this.serviceDraft = { ...this.serviceDraft, tiempoAproximado: tiempo };
  }

  onDaySelectionChange(event: { index: number; selected: boolean }): void {
    this.days = this.days.map((day, index) =>
      index === event.index ? { ...day, selected: event.selected } : day
    );
  }

  onPreferenceToggle(event: { id: number; checked: boolean }): void {
    if (event.checked) {
      if (this.selectedPreferences.includes(event.id)) {
        return;
      }
      if (this.selectedPreferences.length >= this.MAX_PREFERENCES) {
        Swal.fire({
          title: 'Límite alcanzado',
          text: `Solo puedes seleccionar hasta ${this.MAX_PREFERENCES} preferencias.`,
          icon: 'info',
          confirmButtonColor: '#4a9c9f'
        });
        return;
      }
      this.selectedPreferences = [...this.selectedPreferences, event.id];
    } else {
      this.selectedPreferences = this.selectedPreferences.filter(id => id !== event.id);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.serviceDraft = { ...this.serviceDraft, imagen: this.imagePreview ?? '' };
    };
    reader.readAsDataURL(file);
  }

  guardarServicio(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.isSubmitting = true;
    this.serviceDraft = { ...this.serviceDraft, horario: this.buildSchedule() };

    this.servicioService.guardar(this.serviceDraft).subscribe({
      next: response => {
        void this.guardarPreferencias(response._idServicio)
          .then(() => {
            Swal.fire({
              title: '¡Éxito!',
              text: 'Servicio y preferencias guardados correctamente.',
              icon: 'success',
              confirmButtonColor: '#4a9c9f'
            }).then(() => this.redirigirSegunRol());
          })
          .catch(() => {
            Swal.fire({
              title: 'Error',
              text: 'El servicio se guardó, pero hubo un error al guardar las preferencias.',
              icon: 'error',
              confirmButtonColor: '#4a9c9f'
            });
          })
          .finally(() => {
            this.isSubmitting = false;
          });
      },
      error: () => {
        this.isSubmitting = false;
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un problema al guardar el servicio.',
          icon: 'error',
          confirmButtonColor: '#4a9c9f'
        });
      }
    });
  }

  private async guardarPreferencias(idServicio: number): Promise<void> {
    const operaciones = this.selectedPreferences.map(idPref =>
      firstValueFrom(
        this.servicioXPreferencia.crear({
          idServicio,
          preferencia: { _idPreferencias: idPref }
        })
      )
    );

    await Promise.all(operaciones);
  }

  private cargarPreferencias(): void {
    this.preferences = [];
    this.preferenciasService.obtenerPreferencias().subscribe({
      next: data => {
        this.preferences = data;
      },
      error: error => {
        console.error('Error al obtener preferencias:', error);
      }
    });
  }

  private establecerProveedor(): void {
    const rol = localStorage.getItem('rol');

    if (rol === 'Admin') {
      const proveedorId = sessionStorage.getItem('idProveedor');
      this.serviceDraft = {
        ...this.serviceDraft,
        _idProveedor: proveedorId ? Number(proveedorId) : 0
      };
    } else if (rol === 'Proveedor') {
      this.authService.usuarioHome().subscribe({
        next: data => {
          try {
            const usuario = JSON.parse(data);
            this.serviceDraft = {
              ...this.serviceDraft,
              _idProveedor: usuario?.id ?? 0
            };
          } catch (error) {
            console.error('Error al parsear usuario:', error);
          }
        },
        error: err => {
          console.error('Error al obtener el usuario:', err);
        }
      });
    } else {
      Swal.fire('Error', 'Rol no válido. No se puede continuar.', 'error');
    }
  }

  private validarFormulario(): boolean {
    if (!this.serviceDraft.nombre.trim()) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El nombre del servicio es obligatorio.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return false;
    }

    if (!this.serviceDraft.descripcion.trim()) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'La descripción es obligatoria.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return false;
    }

    if (
      this.serviceDraft.precio !== null &&
      this.serviceDraft.precio !== undefined &&
      this.serviceDraft.precio < 0
    ) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El precio no puede ser negativo. Usa 0 para servicios gratuitos.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return false;
    }

    if (
      this.serviceDraft.tiempoAproximado !== null &&
      this.serviceDraft.tiempoAproximado !== undefined
    ) {
      if (this.serviceDraft.tiempoAproximado <= 0) {
        Swal.fire({
          title: 'Tiempo inválido',
          text: 'El tiempo aproximado debe ser mayor a 0 minutos.',
          icon: 'warning',
          confirmButtonColor: '#4a9c9f'
        });
        return false;
      }
      if (this.serviceDraft.tiempoAproximado > 480) {
        Swal.fire({
          title: 'Tiempo inválido',
          text: 'El tiempo aproximado no puede exceder 480 minutos (8 horas).',
          icon: 'warning',
          confirmButtonColor: '#4a9c9f'
        });
        return false;
      }
    }

    if (!this.imagePreview) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'Debes subir una imagen del servicio.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return false;
    }

    const diasSeleccionados = this.days.some(day => day.selected);
    if (!diasSeleccionados) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'Debes seleccionar al menos un día disponible.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return false;
    }

    if (!this.startTime || !this.endTime) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'Debes seleccionar el horario de apertura y cierre.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return false;
    }

    if (!this.validarRangoHorario()) {
      return false;
    }

    if (
      this.selectedPreferences.length < this.MIN_PREFERENCES ||
      this.selectedPreferences.length > this.MAX_PREFERENCES
    ) {
      Swal.fire({
        title: 'Preferencias inválidas',
        text: `Debes seleccionar entre ${this.MIN_PREFERENCES} y ${this.MAX_PREFERENCES} preferencias.`,
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return false;
    }

    return true;
  }

  private validarRangoHorario(): boolean {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);

    const inicio = new Date();
    inicio.setHours(startHour, startMinute, 0, 0);

    const fin = new Date();
    fin.setHours(endHour, endMinute, 0, 0);

    if (inicio >= fin) {
      Swal.fire({
        title: 'Horario inválido',
        text: 'La hora de apertura debe ser anterior a la hora de cierre.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return false;
    }

    return true;
  }

  private buildSchedule(): string {
    const selectedDays = this.days
      .filter(day => day.selected)
      .map(day => day.name)
      .join(', ');

    return selectedDays && this.startTime && this.endTime
      ? `${selectedDays}; ${this.startTime} - ${this.endTime}`
      : 'Horario no seleccionado';
  }

  private redirigirSegunRol(): void {
    const rol = localStorage.getItem('rol');
    if (rol === 'Admin') {
      window.history.back();
    } else {
      this.router.navigate(['homeproveedor']);
    }
  }
}
