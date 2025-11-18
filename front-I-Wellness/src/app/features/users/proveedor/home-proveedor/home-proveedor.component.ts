import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ServicioService } from '../../../servicios/services/servicio.service';

@Component({
  selector: 'app-home-proveedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-proveedor.component.html',
  styleUrl: './home-proveedor.component.css'
})
export class HomeProveedorComponent implements OnInit, OnDestroy {
  servicios: any[] = [];
  providerId: number = 0;
  isLoading = false;
  
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly servicioService: ServicioService,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🏠 HomeProveedorComponent: Inicializando...');
    this.loadUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar información del usuario autenticado
   */
  private loadUser(): void {
    this.authService.usuarioHome()
      .pipe(take(1))
      .subscribe({
        next: (userData) => {
          try {
            const user = JSON.parse(userData);
            this.providerId = user?.id ?? 0;
            console.log('✅ Usuario cargado, providerId:', this.providerId);
            this.loadServices();
          } catch (error) {
            console.error('❌ Error al parsear usuario:', error);
          }
        },
        error: (error) => {
          console.error('❌ Error al obtener el usuario:', error);
        }
      });
  }

  /**
   * Cargar servicios del proveedor
   */
  private loadServices(): void {
    if (!this.providerId) {
      return;
    }

    this.isLoading = true;
    this.servicioService.obtenerServiciosPorProveedor(this.providerId)
      .pipe(take(1))
      .subscribe({
        next: (servicios) => {
          this.servicios = servicios;
          this.isLoading = false;
          console.log('✅ Servicios cargados:', this.servicios.length);
        },
        error: (error) => {
          console.error('❌ Error al obtener servicios:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Navegar a una ruta específica
   */
  agregar(ruta: string): void {
    // Guardar el ID del proveedor en sessionStorage para usar en otras páginas
    sessionStorage.setItem('idProveedor', this.providerId.toString());
    // Asegurarse de usar el formato con guiones que coincida con las rutas definidas
    const formattedRoute = ruta === 'agregarservicio' ? 'agregar-servicio' : ruta;
    this.router.navigate([`/proveedor/${formattedRoute}`]);
  }

  /**
   * Navegar a una ruta con ID
   */
  navigateTo(ruta: string, id: number): void {
    // Para rutas de edición que pertenecen al área de proveedor
    if (ruta === 'editar-servicio' || ruta === 'editarservicio') {
      this.router.navigate(['/proveedor/editar-servicio', id]);
    } else {
      // Para otras rutas como 'infoservicio' que están en el nivel superior
      this.router.navigate([`/${ruta}`, id]);
    }
  }

  /**
   * Cambiar el estado de un servicio (activo/inactivo)
   */
  cambiarEstado(servicio: any): void {
    const estadoAnterior = servicio.estado;
    servicio.estado = !servicio.estado;

    this.servicioService.actualizar(servicio._idServicio, servicio)
      .pipe(take(1))
      .subscribe({
        next: () => {
          console.log('✅ Estado del servicio actualizado:', servicio.nombre);
        },
        error: (error) => {
          console.error('❌ Error al actualizar el estado del servicio:', error);
          // Revertir el cambio en caso de error
          servicio.estado = estadoAnterior;
          Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al actualizar el estado del servicio.',
            icon: 'error',
            confirmButtonColor: '#4a9c9f'
          });
        }
      });
  }

  /**
   * Eliminar un servicio
   */
  eliminarServicio(servicio: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el servicio "${servicio.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E82A3C',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Guardar referencia del array actual
        const serviciosBackup = [...this.servicios];
        
        // Optimistic update: remover del array inmediatamente
        this.servicios = this.servicios.filter(s => s._idServicio !== servicio._idServicio);

        this.servicioService.eliminar(servicio._idServicio)
          .pipe(take(1))
          .subscribe({
            next: () => {
              Swal.fire({
                title: '¡Eliminado!',
                text: 'El servicio se ha eliminado correctamente.',
                icon: 'success',
                confirmButtonColor: '#4a9c9f'
              });
            },
            error: (error) => {
              console.error('❌ Error al eliminar el servicio:', error);
              // Revertir cambios en caso de error
              this.servicios = serviciosBackup;
              Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al eliminar el servicio.',
                icon: 'error',
                confirmButtonColor: '#4a9c9f'
              });
            }
          });
      }
    });
  }
}




