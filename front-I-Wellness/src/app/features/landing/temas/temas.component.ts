import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UniversalHeaderComponent } from '../../../shared/components/universal-header/universal-header.component';

@Component({
  selector: 'app-temas',
  imports: [RouterLink, UniversalHeaderComponent],
  templateUrl: './temas.component.html',
  styleUrl: './temas.component.css'
})
export class TemasComponent implements OnInit {
  userRole: 'admin' | 'proveedor' | 'turista' | 'public' = 'public';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Determinar el rol del usuario para el header
    if (this.authService.isAuthenticated()) {
      const rol = localStorage.getItem('rol');
      switch (rol) {
        case 'Admin':
          this.userRole = 'admin';
          break;
        case 'Proveedor':
          this.userRole = 'proveedor';
          break;
        case 'Turista':
          this.userRole = 'turista';
          break;
        default:
          this.userRole = 'public';
      }
    } else {
      this.userRole = 'public';
    }
  }
}
