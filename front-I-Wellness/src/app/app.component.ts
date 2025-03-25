import { Component } from '@angular/core';
import  { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from "./footer/footer.component";
import { HeaderProveedorComponent } from './users/proveedor/header-proveedor/header-proveedor.component';
import { HeaderTuristaComponent } from './users/turista/header-turista/header-turista.component';
import { HeaderAdminComponent } from './users/administrador/header-admin/header-admin.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, HeaderProveedorComponent, HeaderTuristaComponent, HeaderAdminComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title: string = 'front-I-Wellness';
  headerType: string = 'default';

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const headersMap: { [key: string]: string } = {
          '/hometurista': 'headerturista',
          '/homeproveedor': 'headerproveedor',
          '/perfilturista': 'headerturista',
          '/infoservicio': 'headerturista',
          '/editpreferencias': 'headerturista',
          '/agregarservicio': 'headerproveedor',
          '/editarservicio': 'headerproveedor',
          '/dashboard': 'headerproveedor',
          '/homeadmin': 'headeradmin',
          '/perfiladmin': 'headeradmin',
          '/visitantes': 'headeradmin',
          '/servicios': 'headeradmin',
          '/proveedores': 'headeradmin'
        };

        // Asigna el header según la ruta, usa 'default' si no está en el mapa
        this.headerType = headersMap[event.url] || 'default';
      }
    });
  }

}
