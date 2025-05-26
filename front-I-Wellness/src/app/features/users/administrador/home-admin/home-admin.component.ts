import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../admin/services/admin.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.css'],
  imports: [RouterModule, CommonModule]
})
export class AdminComponent implements OnInit {

 
  proveedores: any[] = [];
  errorMessage: string = '';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  // Método para cargar todos los proveedores
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
}
