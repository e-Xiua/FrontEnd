import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../../admin/services/admin.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedores',
  imports: [CommonModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent {

  proveedores: any[] = [];
  errorMessage: string = '';

  constructor(private router: Router, private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  // Método para cargar todos los turistas
  cargarProveedores(): void {
    this.adminService.obtenerProveedores().subscribe(
      (data: any[]) => {
         this.proveedores = data;
        console.log(data);
      },        
      (error: any) => {
        this.errorMessage = 'Error al obtener los proveedores';
        console.error('Error al obtener los proveedores', error);
      }
    );
  }

  deleteProveedor(id: number) {
    // Mostrar alerta de confirmación antes de eliminar
    Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el proveedor de forma permanente.',
      showCancelButton: true,
      confirmButtonColor: '#E82A3C',
      cancelButtonColor: '#4a9c9f',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: { isConfirmed: any; }) => {
      if (result.isConfirmed) {
        // Si el usuario confirma, proceder a eliminar el proveedor
        this.adminService.eliminarUsuario(id).subscribe({
          next: () => {
            // Si se elimina correctamente, recargar la lista de proveedores
            this.cargarProveedores();
            // Mostrar alerta de éxito
            Swal.fire({
              icon: 'success',
              title: 'Proveedor eliminado',
              text: 'El proveedor ha sido eliminado correctamente.',
              confirmButtonColor: '#4a9c9f'
            });
          },
          error: (err: any) => {
            // Si ocurre un error, mostrar alerta de error
            console.error('Error al eliminar proveedor:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error al eliminar',
              text: 'No se pudo eliminar el proveedor. Intenta nuevamente.',
              confirmButtonColor: '#4a9c9f'
            });
          }
        });
      }
    });
  }
  
}
