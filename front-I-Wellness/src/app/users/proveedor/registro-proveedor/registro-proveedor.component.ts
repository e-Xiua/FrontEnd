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
  // Form fields
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  companyName: string = '';
  contactPosition: string = '';
  phone: string = '';
  companyPhone: string = '';
  coordinateX: string = '';
  coordinateY: string = '';

  // Error variables
  nameError: string = '';
  emailError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';
  companyError: string = '';
  phoneError: string = '';
  companyPhoneError: string = '';
  
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Method that maintains compatibility with your existing HTML
  navigateTo(path: string) {
    // Before navigating, we perform the registration
    if (this.validateForm()) {
      this.isLoading = true;
      
      const providerData = {
        nombre: this.name,
        correo: this.email,
        contraseña: this.password,
        nombre_empresa: this.companyName,
        coordenadaX: this.coordinateX || '0',
        coordenadaY: this.coordinateY || '0',
        cargoContacto: this.contactPosition || '',
        telefono: this.phone,
        telefonoEmpresa: this.companyPhone
      };
      
      this.authService.registerProveedor(providerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Successful registration:', response);
          // Now we navigate to the desired route
          this.router.navigate([path]);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);
          
          if (error.error && error.error.includes('correo ya está registrado')) {
            this.emailError = 'This email is already registered';
          } else {
            alert('Registration error: ' + (error.message || 'Please try again'));
          }
        }
      });
    } else {
      console.log('Fix the errors before submitting the form.');
    }
  }

  // Validation methods
  validateForm(): boolean {
    this.validateName();
    this.validateEmail();
    this.validatePassword();
    this.validateConfirmPassword();
    this.validateCompany();
    this.validatePhone();
    this.validateCompanyPhone();
    
    return (
      !this.nameError && 
      !this.emailError && 
      !this.passwordError && 
      !this.confirmPasswordError && 
      !this.companyError && 
      !this.phoneError && 
      !this.companyPhoneError
    );
  }

  validateName() {
    if (!this.name.trim()) {
      this.nameError = 'El nombre solo puede contener letras y espacios';
    } else {
      this.nameError = '';
    }
  }

  validateEmail() {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.email.match(regex)) {
      this.emailError = 'Ingrese un correo electrónico válido';
    } else {
      this.emailError = '';
    }
  }

  validatePassword() {
    if (this.password.length < 6) {
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
    } else {
      this.passwordError = '';
    }
  }

  validateConfirmPassword() {
    if (this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Las contraseñas no coinciden';
    } else {
      this.confirmPasswordError = '';
    }
  }

  validateCompany() {
    if (!this.companyName.trim()) {
      this.companyError = 'Ingrese nombre de la empresa';
    } else {
      this.companyError = '';
    }
  }

  validatePhone() {
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!this.phone.match(phoneRegex)) {
      this.phoneError = 'El teléfono solo puede contener números (7 a 15 dígitos)';
    } else {
      this.phoneError = '';
    }
  }

  validateCompanyPhone() {
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!this.companyPhone.match(phoneRegex)) {
      this.companyPhoneError = 'El teléfono solo puede contener números (7 a 15 dígitos)';
    } else {
      this.companyPhoneError = '';
    }
  }

  registerUser() {
    this.validateName();
    this.validateEmail();
    this.validatePhone();
    this.validatePassword();
    this.validateConfirmPassword();
    this.validateCompany();
    this.validateCompanyPhone();

    if (!this.nameError && !this.emailError && !this.phoneError && !this.passwordError && !this.confirmPasswordError && !this.companyError && !this.companyPhoneError) {
      this.isLoading = true;
      
      
      
      const providerData = {
        nombre: this.name,
        correo: this.email,
        contraseña: this.password,
        nombre_empresa: this.companyName,
        coordenadaX: this.coordinateX || '0',
        coordenadaY: this.coordinateY || '0',
        cargoContacto: this.contactPosition || '',
        telefono: this.phone,
        telefonoEmpresa: this.companyPhone
      };

      this.authService.registerProveedor(providerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registro exitoso:', response);
          
          localStorage.setItem('registeredEmail', this.email);
          
          this.router.navigate(['formulariogustos']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en el registro:', error);
          
          if (error.error && error.error.includes('correo ya está registrado')) {
            this.emailError = 'Este correo electrónico ya está registrado';
          } else {
            alert('Error en el registro. Por favor, intente nuevamente.');
          }
        }
      });
    } else {
      console.log('Corrige los errores antes de enviar el formulario.');
    }
  }


}