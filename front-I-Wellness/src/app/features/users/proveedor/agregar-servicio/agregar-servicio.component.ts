import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';
import { PreferenciasService } from '../../../preferencias/services/preferencias/preferencias.service';
import { ServicioXPreferenciaService } from '../../../preferencias/services/servicioXpreferencias/servicio-xpreferencia.service';

@Component({
  selector: 'app-agregar-servicio',
   standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './agregar-servicio.component.html',
  styleUrl: './agregar-servicio.component.css'
})
export class AgregarServicioComponent {

  usuario: any;

  // Modelo del nuevo servicio
  nuevoServicio = {
    _idProveedor: 0,
    nombre: '',
    descripcion: '',
    precio: null,
    imagen: '',
    horario: '',
    estado: true
  };

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

  imagePreview: string | null = null;

  preferencias: any[] = [];
  selectedPreferences: number[] = [];


  constructor(
    private router: Router, 
    private servicioService: ServicioService, 
    private authService: AuthService,
    private preferenciasService: PreferenciasService, 
    private servicioXPreferencia: ServicioXPreferenciaService, ) {}

    ngOnInit(): void {
      this.cargarPreferencias();
      const rol = localStorage.getItem('rol');
    
      if (rol === 'Admin') {
        const proveedorId = sessionStorage.getItem('idProveedor');
        this.nuevoServicio._idProveedor = proveedorId ? parseInt(proveedorId) : 0;
      } else if (rol === 'Proveedor') {
        this.authService.usuarioHome().subscribe({
          next: (data) => {
            this.usuario = JSON.parse(data);
            this.nuevoServicio._idProveedor = this.usuario.id ?? 0;
          },
          error: (err) => {
            console.error('Error al obtener el usuario:', err);
          }
        });
      } else {
        Swal.fire('Error', 'Rol no válido. No se puede continuar.', 'error');
      }
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

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.nuevoServicio.imagen = this.imagePreview; // Guardamos la imagen en base64
      };
      reader.readAsDataURL(file);
    }
  }

  guardarServicio() {
    // Validaciones
    if (!this.nuevoServicio.nombre.trim()) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El nombre del servicio es obligatorio.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f'
      });
      return;
    }
  
    if (!this.nuevoServicio.descripcion.trim()) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'La descripción es obligatoria.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f' 
      });
      return;
    }
  
    if (this.nuevoServicio.precio !== null && this.nuevoServicio.precio !== undefined && this.nuevoServicio.precio < 0) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El precio no puede ser negativo. Usa 0 para servicios gratuitos.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f' 
      });
      return;
    }
  
    if (!this.imagePreview) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'Debes subir una imagen del servicio.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f' 
      });
      return;
    }
  
    const diasSeleccionados = this.days.some(day => day.selected);
    if (!diasSeleccionados) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'Debes seleccionar al menos un día disponible.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f' 
      });
      return;
    }
  
    if (!this.startTime || !this.endTime) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'Debes seleccionar el horario de apertura y cierre.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f' 
      });
      return;
    }
  
    // Hora de apertura debe ser antes que la de cierre
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute);
  
    const endDate = new Date();
    endDate.setHours(endHour, endMinute);
  
    if (startDate >= endDate) {
      Swal.fire({
        title: 'Horario inválido',
        text: 'La hora de apertura debe ser anterior a la hora de cierre.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f' 
      });
      return;
    }
  
    if (this.selectedPreferences.length < 2 || this.selectedPreferences.length > 5) {
      Swal.fire({
        title: 'Preferencias inválidas',
        text: 'Debes seleccionar entre 2 y 5 preferencias.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f' 
      });
      return;
    }
  
    // Formatear el horario
    this.nuevoServicio.horario = this.getFormattedSchedule();
  
    // Guardar el servicio
    this.servicioService.guardar(this.nuevoServicio).subscribe({
      next: (response: any) => {
        const idServicio = response._idServicio;
        const guardarPreferencias = this.selectedPreferences.map(idPref => {
          return this.servicioXPreferencia.crear({
            idServicio,
            preferencia: { _idPreferencias: idPref }
          }).toPromise();
        });
  
        Promise.all(guardarPreferencias)
          .then(() => {
            Swal.fire({
              title: '¡Éxito!',
              text: 'Servicio y preferencias guardados correctamente.',
              icon: 'success',
              confirmButtonColor: '#4a9c9f' 
            }).then(() => {
              const rol = localStorage.getItem('rol');
              if (rol === 'Admin') {
                window.history.back();
              } else {
                this.router.navigate(['homeproveedor']);
              }
            });
          })
          .catch(() => {
            Swal.fire({
              title: 'Error',
              text: 'El servicio se guardó, pero hubo un error al guardar las preferencias.',
              icon: 'error',
              confirmButtonColor: '#4a9c9f' 
            });
          });
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un problema al guardar el servicio.',
          icon: 'error',
          confirmButtonColor: '#4a9c9f'
        });
      }
    });
  }
  
  
  
}
