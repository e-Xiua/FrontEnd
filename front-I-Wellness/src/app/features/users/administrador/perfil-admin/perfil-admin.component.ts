import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../admin/services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil-admin',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './perfil-admin.component.html',
  styleUrl: './perfil-admin.component.css'
})
export class PerfilAdminComponent {
  admin: any = {
    id: null,
    nombre: '',
    correo: '',
    foto: ''
  };

  constructor(
    private router: Router,    
    private route: ActivatedRoute,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params: { get: (arg0: string) => any; }) => {
      const id = Number(params.get('id'));
      this.adminService.obtenerUsuarioPorId(id).subscribe({
        next: (data: any) => {
          this.admin = data;
          console.log('admin original:', this.admin);
        },
      });
    });
  }
  
  navigateTo(path: string) {
    this.router.navigate([path]);
  }

    guardarCambios(): void {
      const datosActualizar = {
        nombre: this.admin.nombre,
        correo: this.admin.correo,
        foto: this.admin.foto
      };
  
      this.adminService.actualizarAdmin(this.admin.id, datosActualizar)
        .subscribe(
          (response: any) => {
            // Mostrar alerta de éxito con SweetAlert2
            Swal.fire({
              title: 'Administrador actualizado!',
              text: 'La información del administrador se ha actualizado correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#4a9c9f'
            });
          },
          (error: any) => {
            console.error('Error al actualizar el administrador', error);
            // Mostrar alerta de error con SweetAlert2
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al actualizar el administrador.',
              icon: 'error',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#4a9c9f'
            });
          }
        );
    }

}
