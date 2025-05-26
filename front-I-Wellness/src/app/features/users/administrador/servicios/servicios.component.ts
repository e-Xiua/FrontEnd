import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicios',
  imports: [CommonModule],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.css'
})
export class ServiciosComponent {
  servicios: any[] = [];
  errorMessage: string = '';
  idProveedor!: number;


  constructor(
    private servicioService: ServicioService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener el ID del proveedor desde los parámetros de la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idProveedor = +id;
        this.cargarServicios();
      } else {
        this.errorMessage = 'Proveedor no especificado.';
      }
    });
  }

  navigateTo(path: string,id?: any) {
    this.router.navigate([path, id]);
  } 

  cargarServicios(): void {
    this.servicioService.obtenerServiciosPorProveedor(this.idProveedor).subscribe({
      next: (data: any) => {
        this.servicios = data;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los servicios.';
        console.error(error);
      }
    });
  }

  crearServicio(): void {
    sessionStorage.setItem('idProveedor', this.idProveedor.toString());
    this.router.navigate(['/agregarservicio'])
  }

  cambiarEstado(servicio: any) {
    servicio.estado = !servicio.estado; // cambia el estado localmente
  
    this.servicioService.actualizar(servicio._idServicio, servicio).subscribe({
      next: () => {
      },
      error: (err) => {
        console.error('Error al actualizar el estado del servicio:', err);
      }
    });
  }

  eliminarServicio(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el servicio permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E82A3C',
      cancelButtonColor: '#4a9c9f',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicioService.eliminar(id).subscribe({
          next: () => {
            this.servicios = this.servicios.filter(s => s._idServicio !== id);
            Swal.fire('¡Eliminado!', 'El servicio ha sido eliminado.', 'success');
          },
          error: (error) => {
            Swal.fire('Error', 'No se pudo eliminar el servicio.', 'error');
            console.error(error);
          }
        });
      }
    });
  }
  
}
