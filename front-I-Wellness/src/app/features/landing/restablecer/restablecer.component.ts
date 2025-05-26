import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-restablecer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restablecer.component.html',
  styleUrls: ['./restablecer.component.css']
})
export class RestablecerComponent implements OnInit {
  token: string = '';
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';
  mostrarPassword: boolean = false;
  error: string = '';
  cargando: boolean = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'El enlace de restablecimiento no es válido.';
    }
  }

  validarContrasena(password: string): string[] {
    const errores: string[] = [];
    if (password.length < 8) errores.push('La contraseña debe tener al menos 8 caracteres.');
    if (!/[A-Z]/.test(password)) errores.push('Debe contener al menos una letra mayúscula.');
    if (!/[a-z]/.test(password)) errores.push('Debe contener al menos una letra minúscula.');
    if (!/[0-9]/.test(password)) errores.push('Debe contener al menos un número.');
    if (!/[\W_]/.test(password)) errores.push('Debe contener al menos un carácter especial.');
    return errores;
  }

  onSubmit() {
    this.error = '';

    const errores = this.validarContrasena(this.nuevaContrasena);
    if (errores.length > 0) {
      this.error = errores.join(' ');
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;

    this.http.post('http://localhost:8082/auth/reset-password', null, {
      params: {
        token: this.token,
        nuevaContrasena: this.nuevaContrasena
      },
      responseType: 'json'
    }).subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Tu contraseña ha sido restablecida.',
        });
        this.nuevaContrasena = '';
        this.confirmarContrasena = '';
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudo restablecer la contraseña. El enlace puede estar expirado.';
      }
    });
  }
}
