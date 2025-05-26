import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home-proveedor',
  imports: [CommonModule],
  templateUrl: './home-proveedor.component.html',
  styleUrl: './home-proveedor.component.css'
})
export class HomeProveedorComponent {
  
  usuario: any;
  servicios: any[] = [];

  constructor(private router: Router, private authService: AuthService, private servicioService: ServicioService) {}

  navigateTo(path: string,id?: any) {
    this.router.navigate([path, id]);
  } 

  agregar(path: string){
    this.router.navigate([path]);
  }

  ngOnInit(): void {
    this.authService.usuarioHome().subscribe({
      next: (data) => {
        this.usuario = data;
        this.usuario = JSON.parse(data);
        console.log(this.usuario)
        this.traerServicios();
      },
      error: (err) => {
        console.error('Error al obtener el usuario:', err);
      }
    });
  }

  traerServicios(): void {
    this.servicioService.obtenerServiciosPorProveedor(this.usuario.id).subscribe({
      next: (data) => {
        this.servicios = data;
        console.log(this.servicios);
      }
    })
  }
  
  eliminarServicio(servicio: any) {
    // Confirmación antes de eliminar el servicio
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Seguro que deseas eliminar el servicio: ${servicio.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4a9c9f',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        var index = this.servicios.indexOf(servicio);
        this.servicios.splice(index, 1);
        
        // Llamada al servicio para eliminar el servicio en el backend
        this.servicioService.eliminar(servicio._idServicio).subscribe({
          next: () => {
            console.log("Servicio eliminado correctamente");
  
            // Alerta de éxito después de eliminar el servicio
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El servicio se ha eliminado correctamente.',
              icon: 'success',
              confirmButtonColor: '#4a9c9f',
              confirmButtonText: 'Aceptar'
            });
          },
          error: (err) => {
            console.error("Error al eliminar:", err);
  
            // Alerta de error si no se pudo eliminar el servicio
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al eliminar el servicio.',
              icon: 'error',
              confirmButtonColor: '#4a9c9f',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }
  
  cambiarEstado(servicio: any) {
    servicio.estado = !servicio.estado; // Cambia el estado localmente
  
    // Llamada al servicio para actualizar el estado en el backend
    this.servicioService.actualizar(servicio._idServicio, servicio).subscribe({
      next: () => {
        // Alerta de éxito al cambiar el estado
        Swal.fire({
          title: 'Estado actualizado',
          text: `El estado del servicio ha sido cambiado a ${servicio.estado ? 'activo' : 'inactivo'}.`,
          icon: 'success',
          confirmButtonColor: '#4a9c9f',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (err) => {
        console.error('Error al actualizar el estado del servicio:', err);
  
        // Alerta de error si no se pudo actualizar el estado
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al actualizar el estado del servicio.',
          icon: 'error',
          confirmButtonColor: '#4a9c9f',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
  
}  
        
  


