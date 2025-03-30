import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import countriesData from '../../../../assets/countries+cities.json';

@Component({
  selector: 'app-registro-turista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-turista.component.html',
  styleUrl: './registro-turista.component.css'
})
export class RegistroTuristaComponent implements OnInit {
  // Variables de datos
  countriesData: any[] = countriesData as any[];
  countries: string[] = [];
  cities: string[] = [];
  selectedCountry: string = '';
  selectedCity: string = '';

  // Campos del formulario
  name: string = '';
  email: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';

  // Mensajes de error
  nameError: string = '';
  emailError: string = '';
  phoneError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';
  
  // Estado de carga
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.countries = this.countriesData.map(country => country.name);
  }

  onCountryChange() {
    const country = this.countriesData.find(c => c.name === this.selectedCountry);
    this.cities = country ? country.cities : [];
    this.selectedCity = this.cities.length > 0 ? this.cities[0] : '';
  }

  validateName() {
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!this.name.match(regex)) {
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

  validatePhone() {
    const regex = /^[0-9]{7,15}$/;
    if (!this.phone.match(regex)) {
      this.phoneError = 'El teléfono solo puede contener números (7 a 15 dígitos)';
    } else {
      this.phoneError = '';
    }
  }

  validatePassword() {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:;<>,.?/~]).{8,}$/;
    if (!RegExp(regex).exec(this.password)) {
      this.passwordError = 'Debe tener al menos 8 caracteres, una mayúscula, un número y un caracter especial';
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

  registerUser() {
    this.validateName();
    this.validateEmail();
    this.validatePhone();
    this.validatePassword();
    this.validateConfirmPassword();

    if (!this.nameError && !this.emailError && !this.phoneError && !this.passwordError && !this.confirmPasswordError) {
      this.isLoading = true;
      
      // Obtener la ciudad seleccionada o la primera de la lista
      const selectedCity = this.selectedCity || (this.cities.length > 0 ? this.cities[0] : '');
      
      const userData = {
        nombre: this.name,
        correo: this.email,
        contraseña: this.password,
        telefono: this.phone,
        ciudad: selectedCity,
        pais: this.selectedCountry,
      };

      this.authService.registerTurista(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registro exitoso:', response);
          
          // Guardar el email para usarlo en el formulario de gustos
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