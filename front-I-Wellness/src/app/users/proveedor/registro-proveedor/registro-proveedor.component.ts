import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-registro-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-proveedor.component.html',
  styleUrl: './registro-proveedor.component.css'
})
export class RegistroProveedorComponent {
  // Campos del formulario
  nombre: string = '';
  correo: string = '';
  contraseña: string = '';
  confirmarContraseña: string = '';
  nombre_empresa: string = '';
  cargoContacto: string = '';
  telefono: string = '';
  telefonoEmpresa: string = '';
  coordenadaX: string = '';
  coordenadaY: string = '';

  // Variables de error
  nombreError: string = '';
  correoError: string = '';
  contraseñaError: string = '';
  confirmarContraseñaError: string = '';
  empresaError: string = '';
  telefonoError: string = '';
  telefonoEmpresaError: string = '';
  
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Método que mantiene la compatibilidad con tu HTML existente
  navigateTo(path: string) {
    // Antes de navegar, realizamos el registro
    if (this.validateForm()) {
      this.isLoading = true;
      
      const proveedorData = {
        nombre: this.nombre,
        correo: this.correo,
        contraseña: this.contraseña,
        nombre_empresa: this.nombre_empresa,
        coordenadaX: this.coordenadaX || '0',
        coordenadaY: this.coordenadaY || '0',
        cargoContacto: this.cargoContacto || '',
        telefono: this.telefono,
        telefonoEmpresa: this.telefonoEmpresa
      };
      
      this.authService.registerProveedor(proveedorData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registro exitoso:', response);
          // Ahora sí navegamos a la ruta deseada
          this.router.navigate([path]);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en registro:', error);
          
          if (error.error && error.error.includes('correo ya está registrado')) {
            this.correoError = 'Este correo electrónico ya está registrado';
          } else {
            alert('Error en el registro: ' + (error.message || 'Intente nuevamente'));
          }
        }
      });
    } else {
      console.log('Corrige los errores antes de enviar el formulario.');
    }
  }

  // Métodos de validación
  validateForm(): boolean {
    this.validateNombre();
    this.validateCorreo();
    this.validateContraseña();
    this.validateConfirmarContraseña();
    this.validateEmpresa();
    this.validateTelefono();
    this.validateTelefonoEmpresa();
    
    return (
      !this.nombreError && 
      !this.correoError && 
      !this.contraseñaError && 
      !this.confirmarContraseñaError && 
      !this.empresaError && 
      !this.telefonoError && 
      !this.telefonoEmpresaError
    );
  }

  validateNombre() {
    if (!this.nombre.trim()) {
      this.nombreError = 'El nombre es obligatorio';
    } else {
      this.nombreError = '';
    }
  }

  validateCorreo() {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.correo.match(regex)) {
      this.correoError = 'Ingrese un correo electrónico válido';
    } else {
      this.correoError = '';
    }
  }

  validateContraseña() {
    if (this.contraseña.length < 6) {
      this.contraseñaError = 'La contraseña debe tener al menos 6 caracteres';
    } else {
      this.contraseñaError = '';
    }
  }

  validateConfirmarContraseña() {
    if (this.contraseña !== this.confirmarContraseña) {
      this.confirmarContraseñaError = 'Las contraseñas no coinciden';
    } else {
      this.confirmarContraseñaError = '';
    }
  }

  validateEmpresa() {
    if (!this.nombre_empresa.trim()) {
      this.empresaError = 'El nombre de la empresa es obligatorio';
    } else {
      this.empresaError = '';
    }
  }

  validateTelefono() {
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!this.telefono.match(phoneRegex)) {
      this.telefonoError = 'Ingrese un número de teléfono válido (7-15 dígitos)';
    } else {
      this.telefonoError = '';
    }
  }

  validateTelefonoEmpresa() {
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!this.telefonoEmpresa.match(phoneRegex)) {
      this.telefonoEmpresaError = 'Ingrese un número de teléfono válido (7-15 dígitos)';
    } else {
      this.telefonoEmpresaError = '';
    }
  }
}