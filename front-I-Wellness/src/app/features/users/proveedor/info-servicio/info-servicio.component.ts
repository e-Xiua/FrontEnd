import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { CommonModule } from '@angular/common';
import { TipoCambioService } from '../services/tipo-cambio.service';
import { ReservaService } from '../../../servicios/reservas/reserva.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-info-servicio',
  imports: [
    CommonModule, 
    FormsModule,    
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatTimepickerModule],
  templateUrl: './info-servicio.component.html',
  styleUrl: './info-servicio.component.css'
})
export class InfoServicioComponent {

  servicio: any;
  usuario: any;
  proveedor: any;
  tipoCambio: number = 0;

  servicioSeleccionado: any;
  fechaSeleccionada: Date | null = null;
  minFecha: string = '';
  minFechaObj: Date = new Date();
  horaSeleccionada: Date = new Date();
  horariosDisponibles: string = ''; 
  fechaHora: any = new FormControl();  
  diasPermitidos: number[] = [];

  reviews = [
    { name: 'Laura G.', comment: 'Excelente servicio, muy profesional.', rating: 5 },
    { name: 'Carlos M.', comment: 'Todo fue muy puntual y agradable.', rating: 4 },
    { name: 'Ana P.', comment: 'Me encantó, repetiría sin dudar.', rating: 5 },
  ];
  
  averageRating = 4.7;

  constructor(
    private route: ActivatedRoute, 
    private servicioService: ServicioService,
    private tipoCambioService: TipoCambioService,
    private reservaService: ReservaService,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) {}

ngOnInit(): void {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 1);

  this.minFecha = hoy.toISOString().split('T')[0];
  this.minFechaObj = hoy;

  const rol = localStorage.getItem('rol');
  if (rol === 'Turista') {
    this.authService.usuarioHome().subscribe({
      next: (usuario) => {
        this.usuario = JSON.parse(usuario);
      },
      error: (err) => {
        console.error('Error al obtener el usuario:', err);
      }
    });
  }

  this.route.paramMap.subscribe(params => {
    const id = Number(params.get('id'));
    this.servicioService.buscarPorId(id).subscribe({
      next: data => {
        this.servicio = data;
        console.log(this.servicio);
        this.horariosDisponibles = this.servicio.horario;

        // Luego de obtener el servicio, obtener proveedores
        this.usuarioService.obtenerProveedores().subscribe({
          next: proveedores => {
            // Buscar el proveedor cuyo _id coincida con el _idProveedor del servicio
            const proveedor = proveedores.find((p: any) => p.id === this.servicio._idProveedor);
            if (proveedor) {
              this.proveedor = proveedor;
              console.log('Proveedor encontrado:', this.proveedor);
            } else {
              console.warn('No se encontró un proveedor con ese _id');
            }
          },
          error: err => {
            console.error('Error al obtener los proveedores:', err);
          }
        });
      },
      error: err => {
        console.error('Error al obtener el servicio:', err);
      }
    });
  });

  this.tipoCambioService.obtenerTipoCambioUSD().subscribe({
    next: cambio => {
      this.tipoCambio = cambio;
    },
    error: err => {
      console.error('Error al obtener el tipo de cambio', err);
    }
  });
}


  formatearHora(horas: Date): string {
    const hora = horas; // tipo Date
    const horasSeleccionadas = hora.getHours().toString().padStart(2, '0');
    const minutos = hora.getMinutes().toString().padStart(2, '0');
    const horaFormateada = `${horasSeleccionadas}:${minutos}`;
    return horaFormateada;
  }

  // Método para verificar disponibilidad de la hora seleccionada
  verificarDisponibilidad(): boolean {
    const [dias, horas] = this.horariosDisponibles.split(';');
    const [horaInicio, horaFin] = horas.split('-').map(h => h.trim());

    const horaFormateada = this.formatearHora(this.horaSeleccionada);

    const horaSeleccionada = new Date(`1970-01-01T${horaFormateada}:00`);
    const horaInicioObj = new Date(`1970-01-01T${horaInicio}:00`);
    const horaFinObj = new Date(`1970-01-01T${horaFin}:00`);
    if (horaSeleccionada >= horaInicioObj && horaSeleccionada <= horaFinObj) {
      return true; // Hora está dentro del rango permitido
    } else {
      return false; // Hora no disponible
    }
  }

  // Método para realizar la reserva
  hacerReserva() {

      if (!this.fechaSeleccionada) {
    Swal.fire({
      icon: 'warning',
      title: 'Fecha no seleccionada',
      text: 'Por favor, selecciona una fecha para tu reserva.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#4a9c9f' 
    });
    return;
  }

  if (this.verificarDisponibilidad()) {
    const horaFormateada = this.formatearHora(this.horaSeleccionada)
    const fechaServicioFormateada = `${this.formatearFecha(this.fechaSeleccionada!)}T${horaFormateada}`;
    const ahora = new Date();
    const fechaReserva = this.formatearFechaLocal(ahora);
    console.log("user:", this.usuario);
    const reserva = {
      _idServicio: this.servicio._idServicio,
      _idTurista: this.usuario.id,
      fechaServicio: fechaServicioFormateada,
      fechaReserva: fechaReserva,
      estado: "confirmada"
    };


    this.reservaService.save(reserva).subscribe({
      next: (response) => {
        console.log('Reserva realizada con éxito:', response);
        Swal.fire({
          icon: 'success',
          title: '¡Reserva confirmada!',
          text: 'Tu reserva se ha realizado exitosamente.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#4a9c9f' 
        });
      },
      error: (error) => {
        console.error('Error al realizar la reserva:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al reservar',
          text: 'Hubo un problema al hacer la reserva. Intenta nuevamente.',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Hora no disponible',
      text: 'La hora seleccionada no está dentro del horario disponible para este servicio.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#4a9c9f' 
    });
  }
}

  //formatear fecha de hoy
  formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
  }

  // Método para formatear la fecha
 formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

getDayIndex(day: string): number {
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return daysOfWeek.indexOf(day);
}

// Función para filtrar los días habilitados
filtrarDiasDisponibles = (d: Date | null): boolean => {
  const fecha = d || new Date();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Para comparar solo la fecha sin hora

  // Obtener el día de la semana actual
  const dayOfWeek = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  
  // Obtener los días habilitados del servicio
  const diasServicio = this.servicio.horario.split(';')[0].split(',').map((dia: string) => dia.trim());

  // Verificar si el día actual está en los días habilitados
  return diasServicio.includes(this.getDayName(dayOfWeek)) && fecha >= hoy;
};

// Función para obtener el nombre del día a partir del índice
getDayName(index: number): string {
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return daysOfWeek[index];
}



}
