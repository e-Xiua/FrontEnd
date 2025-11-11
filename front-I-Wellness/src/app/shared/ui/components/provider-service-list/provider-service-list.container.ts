import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ServicioService } from '../../../../features/servicios/services/servicio.service';
import {
    ProviderServiceListComponent,
    ProviderServiceListItem,
    ProviderServiceListToggleEvent
} from './provider-service-list.component';

@Component({
  selector: 'app-provider-service-list-container',
  standalone: true,
  imports: [CommonModule, ProviderServiceListComponent],
  template: `
    <app-provider-service-list
      [services]="services"
      [isLoading]="isLoading"
      (create)="onCreate()"
      (view)="onView($event)"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
      (toggleState)="onToggleState($event)"
    ></app-provider-service-list>
  `
})
export class ProviderServiceListContainerComponent implements OnInit {
  services: ProviderServiceListItem[] = [];
  isLoading = false;
  private providerId = 0;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly servicioService: ServicioService
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  onCreate(): void {
    this.router.navigate(['agregarservicio']);
  }

  onView(serviceId: number): void {
    this.router.navigate(['infoservicio', serviceId]);
  }

  onEdit(serviceId: number): void {
    this.router.navigate(['editarservicio', serviceId]);
  }

  onDelete(service: ProviderServiceListItem): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Seguro que deseas eliminar el servicio: ${service.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4a9c9f',
      cancelButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) {
        this.removeService(service);
      }
    });
  }

  onToggleState(event: ProviderServiceListToggleEvent): void {
    const { service, checked } = event;
    const previousState = service.estado;
    service.estado = checked;

    this.servicioService
      .actualizar(service._idServicio, service)
      .pipe(take(1))
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Estado actualizado',
            text: `El estado del servicio ha sido cambiado a ${checked ? 'activo' : 'inactivo'}.`,
            icon: 'success',
            confirmButtonColor: '#4a9c9f'
          });
        },
        error: error => {
          console.error('Error al actualizar el estado del servicio:', error);
          service.estado = previousState;
          Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al actualizar el estado del servicio.',
            icon: 'error',
            confirmButtonColor: '#4a9c9f'
          });
        }
      });
  }

  private loadUser(): void {
    this.authService
      .usuarioHome()
      .pipe(take(1))
      .subscribe({
        next: rawUser => {
          try {
            const parsed = JSON.parse(rawUser);
            this.providerId = parsed?.id ?? 0;
            this.loadServices();
          } catch (error) {
            console.error('Error al parsear usuario:', error);
          }
        },
        error: err => {
          console.error('Error al obtener el usuario:', err);
        }
      });
  }

  private loadServices(): void {
    if (!this.providerId) {
      return;
    }

    this.isLoading = true;

    this.servicioService
      .obtenerServiciosPorProveedor(this.providerId)
      .pipe(take(1))
      .subscribe({
        next: data => {
          this.services = data;
          this.isLoading = false;
        },
        error: err => {
          console.error('Error al obtener servicios:', err);
          this.isLoading = false;
        }
      });
  }

  private removeService(service: ProviderServiceListItem): void {
    const previousServices = [...this.services];
    this.services = this.services.filter(item => item._idServicio !== service._idServicio);

    this.servicioService
      .eliminar(service._idServicio)
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
        error: err => {
          console.error('Error al eliminar servicio:', err);
          this.services = previousServices;
          Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al eliminar el servicio.',
            icon: 'error',
            confirmButtonColor: '#4a9c9f'
          });
        }
      });
  }
}
