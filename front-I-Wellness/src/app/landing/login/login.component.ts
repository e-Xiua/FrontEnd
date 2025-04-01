import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  correo: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.correo || !this.password) {
      this.errorMessage = 'Por favor ingrese correo y contraseña';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.correo, this.password)
    .subscribe({
      next: (response:  any ) =>  {
          this.isLoading = false;
          
          // Redireccionar según el rol
          const user = response.usuario || {};
          const rolNombre = user.rol?.nombre || '';
          
          if (rolNombre === 'Turista') {
            this.router.navigate(['/hometurista']);
          } else if (rolNombre === 'Proveedor') {
            this.router.navigate(['/homeproveedor']);
          } else if (rolNombre === 'Administrador') {
            this.router.navigate(['/homeadmin']);
          } else {
            this.errorMessage = 'Rol de usuario no reconocido';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Error en el inicio de sesión';
        }
      });
  }
}