import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import countriesData from '../../../../../assets/countries+cities.json';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';
import { CountryISO, NgxIntlTelInputModule, PhoneNumberFormat, SearchCountryField} from 'ngx-intl-tel-input';

@Component({
  selector: 'app-registro-turista',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxIntlTelInputModule],
  templateUrl: './registro-turista.component.html',
  styleUrl: './registro-turista.component.css',
  
})
export class RegistroTuristaComponent implements OnInit {

  separateDialCode = false;
	SearchCountryField = SearchCountryField;
	CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
	preferredCountries: CountryISO[] = [CountryISO.CostaRica, CountryISO.Colombia];
  
  // Variables de datos
  countriesData: any[] = countriesData as any[];
  countries: string[] = [];
  cities: string[] = [];
  selectedCountry: string = '';
  selectedCity: string = '';

  // Campos del formulario
  name: string = '';
  email: string = '';
  phone: any = '';
  password: string = '';
  confirmPassword: string = '';
  genero: string = '';
  fechaNacimiento: string = '';
  estadoCivil: string = '';
  imagenPerfil: string = '';
  defaultImg: string = 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'; 

  // Mensajes de error
  nameError: string = '';
  emailError: string = '';
  phoneError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';
  generoError: string = '';
  fechaNacimientoError: string = '';
  estadoCivilError: string = '';
  
  // Estados
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
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
    const phoneNumber = this.phone.internationalNumber;
    const regex = /^\+?\s?[0-9\s]{7,15}$/;
    if (!phoneNumber.match(regex)) {
      this.phoneError = 'El teléfono solo puede contener números (7 a 15 dígitos)';
    } else {
      this.phoneError = '';
    }
  }

  validatePassword() {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:;<>,.?/~]).{8,20}$/;
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

  validateGenero() {
    if (!this.genero) {
      this.generoError = 'Seleccione un género';
    } else {
      this.generoError = '';
    }
  }

  validateFechaNacimiento() {
    if (!this.fechaNacimiento) {
      this.fechaNacimientoError = 'Seleccione una fecha de nacimiento';
    } else {
      // Validar que sea una fecha pasada y que no sea demasiado antigua
      const fechaSeleccionada = new Date(this.fechaNacimiento);
      const hoy = new Date();
      const anioMinimo = 1900;
      
      if (fechaSeleccionada > hoy) {
        this.fechaNacimientoError = 'La fecha no puede ser futura';
      } else if (fechaSeleccionada.getFullYear() < anioMinimo) {
        this.fechaNacimientoError = 'La fecha no puede ser anterior a 1925';
      } else if (hoy.getFullYear() - fechaSeleccionada.getFullYear() < 17) {
        this.fechaNacimientoError = 'Debes ser mayor de 16 años para registrarte';
      }else {
        this.fechaNacimientoError = '';
      }
    }
  }

  validateEstadoCivil() {
    if (!this.estadoCivil) {
      this.estadoCivilError = 'Seleccione un estado civil';
    } else {
      this.estadoCivilError = '';
    }
  }

  registerUser() {
    this.validateName();
    this.validateEmail();
    this.validatePhone();
    this.validatePassword();
    this.validateConfirmPassword();
    this.validateGenero();
    this.validateFechaNacimiento();
    this.validateEstadoCivil();

    if (!this.nameError && !this.emailError && !this.phoneError && !this.passwordError && 
        !this.confirmPasswordError && !this.generoError && !this.fechaNacimientoError && 
        !this.estadoCivilError) {
      this.isLoading = true;
      
      // Obtener la ciudad seleccionada o la primera de la lista
      const selectedCity = this.selectedCity || (this.cities.length > 0 ? this.cities[0] : '');
      
      // Formatear la fecha correctamente (ISO 8601)
      let formattedDate = null;
        if (this.fechaNacimiento) {
          try {
            // Create a proper Date object
            const dateObj = new Date(this.fechaNacimiento);
            // Convert to ISO format to ensure it's correctly parsed by the backend
            formattedDate = dateObj.toISOString();
          } catch (e) {
            console.error('Error formatting date:', e);
          }
        }
      
      const userData = {
        nombre: this.name,
        correo: this.email,
        contraseña: this.password,
        telefono: this.phone.internationalNumber,
        ciudad: this.selectedCity || (this.cities.length > 0 ? this.cities[0] : ''),
        pais: this.selectedCountry,
        genero: this.genero,
        fechaNacimiento: formattedDate,
        estadoCivil: this.estadoCivil,
        foto: this.imagenPerfil || this.defaultImg
      };

      // Registrar al usuario - el servicio actualizará guarda credenciales en localStorage
      this.authService.registerTurista(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registro exitoso:', response);
          
          // Alerta de éxito
          Swal.fire({
            title: '¡Registro Exitoso!',
            text: 'Tu cuenta ha sido registrada correctamente.',
            icon: 'success',
            confirmButtonColor: '#4a9c9f',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            // Después del registro, intentamos login automático
            this.authService.login(userData.correo, userData.contraseña).subscribe({
              next: () => {
                // Redirigir al formulario de gustos tras login exitoso
                this.router.navigate(['formulariogustos']);
              },
              error: (loginError) => {
                console.error('Error en login automático:', loginError);
                // Aun sin login, redirigimos al formulario de gustos para mantener el flujo
                this.router.navigate(['formulariogustos']);
              }
            });
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en el registro:', error);
          
          // Alerta de error con el mensaje correspondiente
          if (error.message && error.message.includes('correo ya está registrado')) {
            this.emailError = 'Este correo electrónico ya está registrado';
            Swal.fire({
              title: 'Error',
              text: 'Este correo electrónico ya está registrado. Por favor, usa otro.',
              icon: 'error',
              confirmButtonColor: '#d33',
              confirmButtonText: 'Aceptar'
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: 'Este correo electrónico ya está registrado. Por favor, usa otro.',
              icon: 'error',
              confirmButtonColor: '#d33',
              confirmButtonText: 'Aceptar'
            });
          }
        }
      });
    } else {
      console.log('Corrige los errores antes de enviar el formulario.');

      // Alerta de validación
      Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor, corrige los errores antes de continuar.',
        icon: 'warning',
        confirmButtonColor: '#4a9c9f',
        confirmButtonText: 'Aceptar'
      });
    }
  }

onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPerfil = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}
}