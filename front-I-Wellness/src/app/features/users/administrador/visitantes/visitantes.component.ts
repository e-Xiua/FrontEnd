import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../../admin/services/admin.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-visitantes',
  imports: [CommonModule],
  templateUrl: './visitantes.component.html',
  styleUrl: './visitantes.component.css'
})
export class VisitantesComponent {

  visitantes: any[] = [];
  errorMessage: string = '';

  constructor(private router: Router, private adminService: AdminService) {}

  
  ngOnInit(): void {
    this.cargarTuristas();
  }

  // Método para cargar todos los turistas
  cargarTuristas(): void {
    this.adminService.obtenerTuristas().subscribe(
      (data: any[]) => {
         this.visitantes = data;
        console.log(data);
      },        
      (error: any) => {
        this.errorMessage = 'Error al obtener los turistas';
        console.error('Error al obtener los turistas', error);
      }
    );
  }

  navigateTo(ruta: string, id?: number) {
    if (id) {
      this.router.navigate([ruta, id]);
    } else {
      this.router.navigate([ruta]);
    }
  }

  deleteVisitante(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Este visitante será eliminado permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E82A3C',
      cancelButtonColor: '#4a9c9f',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.eliminarUsuario(id).subscribe({
          next: () => {
            this.cargarTuristas();
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El visitante fue eliminado correctamente.',
              confirmButtonColor: '#4a9c9f'
            });
          },
          error: (err: any) => {
            console.error('Error al eliminar visitante:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al eliminar el visitante. Intenta nuevamente.',
              confirmButtonColor: ' #4a9c9f'
            });
          }
        });
      }
    });
  }

  agregar(path: string){
    this.router.navigate([path]);
  }
}
