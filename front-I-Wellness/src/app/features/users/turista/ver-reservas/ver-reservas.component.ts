import { Component } from '@angular/core';
import { ReservaService } from '../../../servicios/reservas/reserva.service';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { forkJoin } from 'rxjs';
import { UsuarioService } from '../../services/usuario.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ver-reservas',
  imports: [CommonModule],
  templateUrl: './ver-reservas.component.html',
  styleUrl: './ver-reservas.component.css'
})
export class VerReservasComponent {

  servicios: any;
  reservas: any;
  usuario: any;
  proveedores: any;
  proveedoresFiltrados: any;

  cargando: boolean = true;
  proveedoresAbiertos: Set<number> = new Set();



  constructor(
    private servicioService: ServicioService,
    private reservaService: ReservaService,
    private authService: AuthService,
    private usuariosService: UsuarioService 
  ) {}

ngOnInit(): void {
    this.authService.usuarioHome().subscribe({
      next: (usuario) => {
        this.usuario = JSON.parse(usuario); 
        this.cargarReservas();
      },
      error: (error) => {
        console.error('Error al obtener el usuario:', error);
        this.cargando = false;
      }
    });
  }

  cargarReservas(): void {
    this.reservaService.getReservasPorTurista(this.usuario.id).subscribe({
      next: (reservas) => {
        this.reservas = reservas;
        console.log("reservas: ",this.reservas)
        this.cargarServiciosDeReservas();
      },
      error: (error) => {
        console.error('Error al obtener reservas:', error);
        this.cargando = false;
      }
    });
  }

cargarServiciosDeReservas(): void {
  this.servicios = []; // Cambiar de objeto vacío a array vacío

  const idsUnicos: number[] = Array.from(new Set(this.reservas.map((r: { _idServicio: any; }) => Number(r._idServicio))));

  const peticiones = idsUnicos.map(id =>
    this.servicioService.buscarPorId(id).toPromise().then(servicio => {
      this.servicios.push(servicio); // Usar push para agregar el servicio al array
    }).catch(error => {
      console.error(`Error al cargar servicio con id ${id}:`, error);
    })
  );

  // Llamar a obtenerProveedores después de que todas las promesas se hayan resuelto
  Promise.all(peticiones).then(() => {
    this.obtenerProveedores(); // Llamar a obtenerProveedores solo una vez
    this.cargando = false;
    this.actualizarEstadoReservas();
  });
}

actualizarEstadoReservas(): void {
    const fechaHoy = new Date(); // Fecha actual

    this.reservas.forEach((reserva: any) => {
      const fechaServicio = new Date(reserva.fechaServicio); // Fecha de servicio de la reserva
      if (fechaServicio < fechaHoy && reserva.estado !== 'completada' && reserva.estado !== 'cancelada') {
        // Si la fecha de servicio ya pasó y no está marcada como completada
        const reservaActualizada = {
          ...reserva,
          estado: 'completada'
        };

        this.reservaService.update(reservaActualizada).subscribe({
          next: (response) => {
            console.log('Reserva marcada como completada:', response);
            reserva.estado = 'completada'; // Actualizar estado en la interfaz
          },
          error: (error) => {
            console.error('Error al actualizar el estado de la reserva:', error);
          }
        });
      }
    });
  }

  // Método para obtener el proveedor de un servicio dado el id del proveedor
  obtenerProveedores(): void {
        this.usuariosService.obtenerProveedores().subscribe({
          next: (proveedores) => {
            this.proveedores = proveedores;
            this.filtrarProveedoresPorReservas();
          },
          error: (error) => {
            console.error('Error al obtener proveedores:', error);
            this.cargando = false;
          }
        });
  }

  // Método para filtrar los proveedores que existen en las reservas
  filtrarProveedoresPorReservas(): void {
    // Obtenemos los idProveedores únicos de las reservas
// Obtenemos los idProveedor únicos de los servicios
const idsProveedoresServicios = Array.from(
  new Set(this.servicios.map((servicio: { _idProveedor: any; }) => servicio._idProveedor))
);

// Filtramos los proveedores que tienen proveedorInfo, nombre_empresa y cuyo id está en los servicios
this.proveedoresFiltrados = this.proveedores.filter(
  (proveedor: any) =>
    proveedor.proveedorInfo &&
    proveedor.proveedorInfo.nombre_empresa &&
    idsProveedoresServicios.includes(proveedor.id)
);

console.log('Proveedores filtrados:', this.proveedoresFiltrados);
this.cargando = false;
  }

  alternarProveedor(id: number): void {
    if (this.proveedoresAbiertos.has(id)) {
      this.proveedoresAbiertos.delete(id); // cerrar
    } else {
      this.proveedoresAbiertos.add(id); // abrir
    }
  }

  cancelarReserva(reserva: any): void {
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar',
    confirmButtonColor: '#E82A3C',
    cancelButtonColor: '#4a9c9f',
    cancelButtonText: 'No, volver',
  }).then((result) => {
    if (result.isConfirmed) {
      const reservaActualizada = {
        id: reserva.id,
        _idTurista: reserva._idTurista,
        _idServicio: reserva._idServicio,
        fechaReserva: reserva.fechaReserva,
        fechaServicio: reserva.fechaServicio,
        estado: 'cancelada',
      };

      console.log('Reserva cancelada:', reservaActualizada);

      this.reservaService.update(reservaActualizada).subscribe({
        next: (response) => {
          console.log('Reserva actualizada con éxito', response);
          // Actualizar el estado en la interfaz localmente
          reserva.estado = 'cancelada';
        Swal.fire({
          title: '¡Cancelado!',
          text: 'La reserva ha sido cancelada exitosamente.',
          icon: 'success',
          confirmButtonColor: '#4a9c9f',
        });
        },
        error: (error) => {
          console.error('Error al cancelar la reserva:', error);
          Swal.fire(
            'Error',
            'Ocurrió un error al cancelar la reserva.',
            'error'
          );
        }
      });
    }
  });
}

getEstadoClass(estado: string): string {
  switch (estado) {
    case 'completada':
      return 'estado-completada';  // clase para el estado completada
    case 'cancelada':
      return 'estado-cancelada';   // clase para el estado cancelada
    case 'pendiente':
      return 'estado-pendiente';   // clase para el estado pendiente
    default:
      return '';
  }
}
}
