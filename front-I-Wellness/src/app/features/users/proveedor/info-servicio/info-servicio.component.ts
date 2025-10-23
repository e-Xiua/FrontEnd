import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Review, ReviewDisplayComponent } from '../../../../shared/ui/components/review-display/review-display.component';
import { ReviewFormComponent, ReviewSubmission } from '../../../../shared/ui/components/review-form/review-form.component';
import { ReservaService } from '../../../servicios/reservas/reserva.service';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { UsuarioService } from '../../services/usuario.service';
import { TipoCambioService } from '../services/tipo-cambio.service';

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
    MatTimepickerModule,
    ReviewDisplayComponent,
    ReviewFormComponent
  ],
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

  // Review properties
  reviews: Review[] = [];
  averageRating: number = 4.7;
  hasReservation: boolean = false;
  currentUserRole: string | null = null;
  servicioId: number = 0;

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

  // Obtener el rol del usuario
  this.currentUserRole = localStorage.getItem('rol');

  this.route.paramMap.subscribe(params => {
    const id = Number(params.get('id'));
    this.servicioId = id;

    this.servicioService.buscarPorId(id).subscribe({
      next: data => {
        this.servicio = data;
        console.log(this.servicio);
        this.horariosDisponibles = this.servicio.horario;

        // Cargar reseñas mock (TODO: reemplazar con datos reales del backend)
        this.loadMockReviews();

        // Si es turista, cargar usuario primero y LUEGO verificar reservas
        if (this.currentUserRole === 'Turista') {
          this.authService.usuarioHome().subscribe({
            next: (usuario) => {
              this.usuario = JSON.parse(usuario);
              console.log('Usuario turista cargado:', this.usuario);
              // AHORA sí verificar reservas con el usuario cargado
              this.checkUserHasReservation(id, this.usuario.id);
            },
            error: (err) => {
              console.error('Error al obtener el usuario:', err);
            }
          });
        }

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

// Métodos para gestión de reseñas

/**
 * Verifica si el usuario turista tiene una reserva para este servicio
 */
checkUserHasReservation(servicioId: number, usuarioId: number): void {
  console.log('Verificando reservas para:', { servicioId, usuarioId });

  this.reservaService.getAll().subscribe({
    next: (reservas: any[]) => {
      console.log('Total de reservas obtenidas:', reservas.length);
      console.log('Reservas completas:', reservas);

      // Buscar si existe una reserva del usuario para este servicio
      this.hasReservation = reservas.some(
        (reserva: any) => {
          const coincideServicio = reserva._idServicio === servicioId;
          const coincideTurista = reserva._idTurista === usuarioId;
          const estaConfirmada = reserva.estado === 'confirmada';

          console.log('Comparando reserva:', {
            reserva: reserva,
            coincideServicio,
            coincideTurista,
            estaConfirmada,
            resultado: coincideServicio && coincideTurista && estaConfirmada
          });

          return coincideServicio && coincideTurista && estaConfirmada;
        }
      );

      console.log('✅ Resultado final - Usuario tiene reserva:', this.hasReservation);
    },
    error: (err: any) => {
      console.error('❌ Error al verificar reservas:', err);
      this.hasReservation = false;
    }
  });
}

/**
 * Determina si el usuario actual puede escribir reseñas
 */
canWriteReview(): boolean {
  if (this.currentUserRole === 'PROVEEDOR' || this.currentUserRole === 'Proveedor') {
    return true;
  }
  if (this.currentUserRole === 'TURISTA' || this.currentUserRole === 'Turista') {
    return this.hasReservation;
  }
  return false;
}

/**
 * Maneja el envío de una nueva reseña
 */
handleReviewSubmit(reviewData: ReviewSubmission): void {
  console.log('Nueva reseña recibida:', reviewData);

  // TODO: Enviar la reseña al backend
  // this.reviewService.createReview(reviewData).subscribe(...)

  Swal.fire({
    icon: 'success',
    title: '¡Gracias por tu reseña!',
    text: 'Tu opinión ha sido publicada exitosamente.',
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#4a9c9f'
  });

  // Recargar las reseñas (cuando esté implementado en el backend)
  // this.loadReviews(this.servicioId);
}

/**
 * Carga reseñas mock (temporal hasta tener backend)
 */
loadMockReviews(): void {
  this.reviews = [
    {
      id: 1,
      author: 'Laura García',
      avatar: 'https://i.pravatar.cc/150?img=5',
      date: '2024-10-15',
      rating: 5,
      comment: 'Excelente servicio, muy profesional y atento. La experiencia superó mis expectativas.',
      helpful: 12,
      notHelpful: 1,
      authorId: 101
    },
    {
      id: 2,
      author: 'Carlos Martínez',
      avatar: 'https://i.pravatar.cc/150?img=12',
      date: '2024-10-10',
      rating: 4,
      comment: 'Todo fue muy puntual y agradable. Recomendado.',
      helpful: 8,
      notHelpful: 0,
      authorId: 102
    },
    {
      id: 3,
      author: 'Ana Pérez',
      avatar: 'https://i.pravatar.cc/150?img=20',
      date: '2024-10-05',
      rating: 5,
      comment: 'Me encantó, repetiría sin dudar. Muy buena relación calidad-precio.',
      helpful: 15,
      notHelpful: 2,
      authorId: 103
    }
  ];

  // Calcular el rating promedio
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = this.reviews.length > 0 ? totalRating / this.reviews.length : 0;
}

}
