import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MapForAllProvidersComponent } from "../../../../shared/components/map-for-all-providers/map-for-all-providers.component";
import { Route, RouteSelectionEvent } from '../../../../shared/models/route'; // 1. Import the Route model
import { usuarios } from '../../../../shared/models/usuarios';
import { RouteGenerationComponent } from '../../../../shared/ui/components/route-generation';

@Component({
  selector: 'app-creador-de-rutas',
  standalone: true, // Make it standalone
  imports: [CommonModule, RouteGenerationComponent, MapForAllProvidersComponent], // Add CommonModule for *ngIf
  templateUrl: './creador-de-rutas.component.html',
  styleUrls: ['./creador-de-rutas.component.css']
})
export class CreadorDeRutasComponent implements OnInit {

  currentUserId?: string;

    ngOnInit(): void {
      // Obtén el ID del usuario autenticado de tu servicio de autenticación
      // Por ejemplo:
      // this.currentUserId = this.authService.getCurrentUser()?.id;

      // O desde localStorage:
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        this.currentUserId = userData.id || userData.userId;
      }

      // TEMPORAL: Para testing, puedes usar un ID fijo:
      // this.currentUserId = '123';
    }

    onRouteSelected(event: RouteSelectionEvent): void {
      console.log('Turista - Ruta seleccionada:', event.route);

      // Aquí puedes:
      // - Navegar al mapa interactivo de la ruta
      // - Iniciar navegación
      // - Compartir la ruta
      // - Marcar como favorita
    }

    onProviderSelected(event: { route: Route; provider: usuarios }): void {
      console.log('Turista - Proveedor seleccionado:', event.provider);

      // Aquí puedes:
      // - Ver detalles del proveedor
      // - Hacer una reserva
      // - Ver reseñas
      // - Contactar al proveedor
    }

}
