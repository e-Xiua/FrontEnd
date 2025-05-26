import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

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
  emailError: string = '';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  validateEmail() {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.correo.match(regex)) {
      this.emailError = 'Ingrese un correo electrónico válido';
    } else {
      this.emailError = '';
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.correo || !this.password) {
      Swal.fire({
        icon: 'error',
        title: 'Rol no reconocido',
        text: 'Contacta al administrador',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4a9c9f'
      });
      return;
    }
  
    this.isLoading = true;
    this.errorMessage = '';
  
    this.authService.login(this.correo, this.password).subscribe({
      next: () => {
        // Login exitoso, ahora obtenemos el rol del usuario
        this.authService.getUsuarioActual().subscribe({
          next: (rol: string) => {
            localStorage.setItem('rol', rol); // Guardamos el rol en localStorage si quieres
  
            // Redirigir según el rol
            if (rol === 'Turista') {
              this.router.navigate(['/hometurista']);
            } else if (rol === 'Proveedor') {
              this.router.navigate(['/homeproveedor']);
            } else if (rol === 'Admin') {
              this.router.navigate(['/homeadmin']);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Rol no reconocido',
                text: 'Contacta al administrador',
                confirmButtonText: 'OK'
              });
            }
  
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'No se pudo obtener el rol del usuario',
              confirmButtonText: 'Reintentar'
            });
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        const mensaje = err.error?.message || 'Error en el inicio de sesión';
        Swal.fire({
          icon: 'error',
          title: 'Login fallido',
          text: mensaje,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4a9c9f'
        });
      }
    });
  }
  
}
