import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioService } from '../../../servicios/services/servicio.service';
import Swal from 'sweetalert2';
import { PreferenciasService } from '../../../preferencias/services/preferencias/preferencias.service';
import { ServicioXPreferenciaService } from '../../../preferencias/services/servicioXpreferencias/servicio-xpreferencia.service';

@Component({
  selector: 'app-editar-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './editar-servicio.component.html',
  styleUrl: './editar-servicio.component.css'
})
export class EditarServicioComponent {
  // Días de la semana disponibles
  days = [
    { name: 'Lunes', selected: false },
    { name: 'Martes', selected: false },
    { name: 'Miércoles', selected: false },
    { name: 'Jueves', selected: false },
    { name: 'Viernes', selected: false },
    { name: 'Sábado', selected: false },
    { name: 'Domingo', selected: false }
  ];

  // Horario de inicio y fin
  startTime: string = '';
  endTime: string = '';

  servicio: any;

  preferencias: any[] = [];
  selectedPreferences: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private servicioService: ServicioService,
    private preferenciasService: PreferenciasService, 
    private servicioXPreferencia: ServicioXPreferenciaService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.servicioService.buscarPorId(id).subscribe({
        next: data => {
          this.servicio = data;
          this.cargarPreferencias();
          this.cargarPreferenciasServicio();
          this.parseHorario(this.servicio.horario);
        }
      });
    });
  }

  cargarPreferencias() {
    this.preferenciasService.obtenerPreferencias().subscribe({
      next: (data) => {
        this.preferencias = data;
        console.log('Preferencias cargadas:', this.preferencias);
      },
      error: (error) => {
        console.error('Error al obtener preferencias:', error);
        // En caso de error, cargar preferencias predeterminadas
      }
    });
  }

  cargarPreferenciasServicio() {
    const idServicio = this.servicio._idServicio; // Asegúrate de tener el ID del servicio cargado
    this.servicioXPreferencia.obtenerPorServicio(idServicio).subscribe({
      next: (preferenciasServicio) => {
        // Obtener los IDs de las preferencias asociadas al servicio
        this.selectedPreferences = preferenciasServicio.map((p: any) => p.preferencia._idPreferencias);
  
        // Marcar las preferencias seleccionadas en la lista de preferencias
        this.preferencias.forEach(preferencia => {
          // Verificamos si el ID de la preferencia está en la lista de seleccionadas
          preferencia.selected = this.selectedPreferences.includes(preferencia._idPreferencias);
        });
  
        console.log('Preferencias seleccionadas para el servicio:', this.selectedPreferences);
      },
      error: (error) => {
        console.error('Error al obtener preferencias del servicio:', error);
      }
    });
  }

  onPreferenceChange(event: any, idPreferencia: number) {
    if (event.target.checked) {
      if (this.selectedPreferences.length < 5) {
        this.selectedPreferences.push(idPreferencia);
      } else {
        // Desmarca si ya hay 5 seleccionadas
        event.target.checked = false;
      }
    } else {
      this.selectedPreferences = this.selectedPreferences.filter(id => id !== idPreferencia);
    }
  }

  private parseHorario(horario: string): void {
    if (!horario) return;
  
    const [diasParte, horaParte] = horario.split('; ');
  
    const diasSeleccionados = diasParte.split(',').map(d => d.trim());
  
    this.days.forEach(day => {
      day.selected = diasSeleccionados.includes(day.name);
    });
  
    if (horaParte) {
      const horas = horaParte.split('-').map(h => h.trim());
  
      // Asegurar que las horas estén en formato HH:mm
      const formatHora = (hora: string) => hora.length === 5 ? hora : (hora.length === 2 ? `${hora}:00` : '');
  
      this.startTime = formatHora(horas[0]);
      this.endTime = formatHora(horas[1]);
    }
  }
  

  // Método para generar la cadena de horario estandarizada
  getFormattedSchedule(): string {
    const selectedDays = this.days
      .filter(day => day.selected)
      .map(day => day.name)
      .join(', ');

    return selectedDays && this.startTime && this.endTime
      ? `${selectedDays}; ${this.startTime} - ${this.endTime}`
      : 'Horario no seleccionado';
      
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.servicio.imagen = reader.result as string; // base64
      };
      reader.readAsDataURL(file);
    }
  }
  
  navigateTo() {
    this.servicio.horario = this.getFormattedSchedule();

    if (this.selectedPreferences.length < 2) {
      Swal.fire({
        title: '¡Error!',
        text: 'Debe seleccionar al menos 2 preferencias.',
        icon: 'error',
        confirmButtonColor: '#4a9c9f',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.eliminarPreferenciasDeServicio(this.servicio._idServicio);

    const servicioXPreferenciaData = this.selectedPreferences.map((idPreferencia) => ({
      idServicio: this.servicio._idServicio,
      preferencia: {
        _idPreferencias: idPreferencia
      }
    }));

    this.servicioService.actualizar(this.servicio._idServicio, this.servicio).subscribe({
      next: () => {
        this.guardarRelacionesIndividuales(servicioXPreferenciaData);

        Swal.fire({
          title: '¡Servicio actualizado!',
          text: 'El servicio se ha actualizado correctamente.',
          icon: 'success',
          confirmButtonColor: '#4a9c9f',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          const rol = localStorage.getItem('rol');

          if (rol === 'Admin') {
            window.history.back();
          } else if (rol === 'Proveedor') {
            this.router.navigate(['homeproveedor']);
          } else {
            console.log('Rol no reconocido');
          }
        });
      },
      error: err => {
        console.error('Error al actualizar el servicio:', err);

        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al actualizar el servicio.',
          icon: 'error',
          confirmButtonColor: '#4a9c9f',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  eliminarPreferenciasDeServicio(idServicio: number) {
    this.servicioXPreferencia.eliminarPreferenciasPorServicio(idServicio).subscribe({
      next: () => {
        console.log('Preferencias eliminadas para el servicio:', idServicio);
      },
      error: (err) => {
        console.error('Error al eliminar las preferencias del servicio', err);

        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al eliminar las preferencias.',
          icon: 'error',
          confirmButtonColor: '#4a9c9f',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
  
  // Método para guardar cada relación de ServicioXPreferencia individualmente
  guardarRelacionesIndividuales(servicioXPreferenciaData: any[]) {
    servicioXPreferenciaData.forEach((data) => {
      this.servicioXPreferencia.crear(data).subscribe({
        next: () => {
          console.log('Relación de ServicioXPreferencia guardada con éxito:', data);
        },
        error: (err) => {
          console.error('Error al guardar la relación de ServicioXPreferencia', err);

          Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al guardar una relación de preferencia.',
            icon: 'error',
            confirmButtonColor: '#4a9c9f',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    });
  }

}
