import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recuperar',
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar.component.html',
  styleUrl: './recuperar.component.css',
})
export class RecuperarComponent {
  correo: string = '';
  emailError: string = '';

  constructor(private http: HttpClient) {}

  validateEmail() {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.correo.match(regex)) {
      this.emailError = 'Ingrese un correo electrónico válido';
      return false;
    } else {
      this.emailError = '';
      return true;
    }
  }


  onSubmit() {
    if (!this.correo || !this.validateEmail()) {
      this.emailError = 'Por favor ingrese un correo electrónico válido';
      return;
    }
    this.http.post('http://localhost:8082/auth/request-reset-password', null, {
      params: { correo: this.correo },
      responseType: 'text' as 'json'
    }).subscribe({
      next: (response) => {
            console.log('Respuesta del servidor:', response);
        Swal.fire({
          icon: 'success',
          title: 'Correo enviado',
          text: 'Revisa tu correo para restablecer la contraseña.',
        });
      },
      error: (error) => {
        console.error('Error del servidor:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo enviar el correo. Verifica el correo ingresado.',
        });
      }
    });
  }
}
