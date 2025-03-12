import { Component } from '@angular/core';
import  { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from "./footer/footer.component";
import { HeaderProveedorComponent } from './users/proveedor/header-proveedor/header-proveedor.component';
import { HeaderTuristaComponent } from './users/turista/header-turista/header-turista.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, HeaderProveedorComponent, HeaderTuristaComponent],
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
          '/agregarservicio': 'headerproveedor',
          '/editarservicio': 'headerproveedor',
          '/dashboard': 'headerproveedor'
        };

        // Asigna el header según la ruta, usa 'default' si no está en el mapa
        this.headerType = headersMap[event.url] || 'default';
      }
    });
  }

}
