import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { HeaderAdminComponent } from './features/users/administrador/header-admin/header-admin.component';
import { HeaderProveedorComponent } from './features/users/proveedor/header-proveedor/header-proveedor.component';
import { HeaderTuristaComponent } from './features/users/turista/header-turista/header-turista.component';
import { HeaderComponent } from './layout/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    HeaderProveedorComponent,
    HeaderTuristaComponent,
    HeaderAdminComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title: string = 'front-I-Wellness';
  headerType: string = 'default';
 

  constructor(private router: Router) {

    if (!sessionStorage.getItem('sessionStarted')) {
      localStorage.removeItem('rol');
      sessionStorage.setItem('sessionStarted', 'true');
    }
    
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Obtener el rol almacenado en el localStorage
        const rol = localStorage.getItem('rol');  // Aquí asumimos que el rol está guardado en localStorage con la clave 'rol'
  
        // Determinar el tipo de encabezado dependiendo del rol
        if (rol === 'Turista') {
          this.headerType = 'headerturista';
        } else if (rol === 'Proveedor') {
          this.headerType = 'headerproveedor';
        } else if (rol === 'Admin') {
          this.headerType = 'headeradmin';
        } else {
          this.headerType = 'default';
        }
  
      }
    });
  }
}
