import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { UniversalHeaderComponent } from './shared/components/universal-header/universal-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UniversalHeaderComponent,
  ],
  template: `
    <!-- Header público solo para rutas públicas -->
    <app-universal-header
      *ngIf="showPublicHeader"
      role="public">
    </app-universal-header>

    <!-- Router outlet principal - los layouts manejarán sus propios headers -->
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title: string = 'front-I-Wellness';
  showPublicHeader = true;

  private publicRoutes = [
    '',
    'temas',
    'registro',
    'login',
    'registroturista',
    'recuperar',
    'restablecer',
    'registroproveedor'
  ];

  constructor(private router: Router) {
    // Limpiar almacenamiento al iniciar nueva sesión
    if (!sessionStorage.getItem('sessionStarted')) {
      localStorage.removeItem('rol');
      sessionStorage.setItem('sessionStarted', 'true');
    }
  }

  ngOnInit(): void {
    // Escuchar cambios de ruta para actualizar visibilidad del header público
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePublicHeaderVisibility(event.url);
      });

    // Verificar ruta inicial
    this.updatePublicHeaderVisibility(this.router.url);
  }

  private updatePublicHeaderVisibility(url: string): void {
    const path = url.split('/')[1] || ''; // Obtener primer segmento de la URL
    this.showPublicHeader = this.publicRoutes.includes(path);
  }
}
