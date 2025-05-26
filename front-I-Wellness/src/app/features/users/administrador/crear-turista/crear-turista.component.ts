import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import countriesData from '../../../../../assets/countries+cities.json';
import { AdminService } from '../../../admin/services/admin.service';
import { TuristaXPreferenciaService } from '../../../preferencias/services/turistaXpreferencias/turista-xpreferencia.service';
import { PreferenciasService } from '../../../preferencias/services/preferencias/preferencias.service';
import Swal from 'sweetalert2';
import { CountryISO, NgxIntlTelInputModule, PhoneNumberFormat, SearchCountryField} from 'ngx-intl-tel-input';


@Component({
  selector: 'app-crear-turista',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxIntlTelInputModule],
  templateUrl: './crear-turista.component.html',
  styleUrl: './crear-turista.component.css'
})
export class CrearTuristaComponent implements OnInit {
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
  fechaNacimiento: Date | string = new Date();
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

  // Estado de carga
  isLoading: boolean = false;

  preferencias: any[] = [];
  selectedPreferences: number[] = [];

  constructor(
    private adminService: AdminService,
    private preferenciasService: PreferenciasService, 
    private turistaXPreferencia: TuristaXPreferenciaService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.countries = this.countriesData.map(country => country.name);
    this.cargarPreferencias();
    
  }

  cargarPreferencias() {
    this.preferenciasService.obtenerPreferencias().subscribe({
      next: (data) => {
        this.preferencias = data;
        console.log('Preferencias cargadas:', this.preferencias);
      },
      error: (error) => {
        console.error('Error al obtener preferencias:', error);
        // En caso de error, cargar preferencias predeterminadas
      }
    });
  }

  onPreferenceChange(event: any, idPreferencia: number) {
    if (event.target.checked) {
      if (this.selectedPreferences.length < 5) {
        this.selectedPreferences.push(idPreferencia);
      } else {
        // Desmarca si ya hay 5 seleccionadas
        event.target.checked = false;
      }
    } else {
      this.selectedPreferences = this.selectedPreferences.filter(id => id !== idPreferencia);
    }
  }

  validatePreferences() {
    if (this.selectedPreferences.length < 3 || this.selectedPreferences.length > 5) {
    }
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
    const regex = /^[A-Za-z\s]+$/;
    if (!this.genero.match(regex)) {
      this.generoError = 'El genero solo puede contener letras y espacios';
    } else {
      this.generoError = '';
    }
  } 

  validateFechaNacimiento() {
    if (!this.fechaNacimiento) {
      this.fechaNacimientoError = 'La fecha de nacimiento es obligatoria';
      return;
    }
    
    const fechaComoDate = (this.fechaNacimiento instanceof Date) ? 
      this.fechaNacimiento : new Date(this.fechaNacimiento);
    
    if (isNaN(fechaComoDate.getTime())) {
      this.fechaNacimientoError = 'La fecha de nacimiento no es válida';
      return;
    }
    
    const hoy = new Date();
    const anioMin = 1900;
    const edad = hoy.getFullYear() - fechaComoDate.getFullYear();
    
    if (fechaComoDate.getFullYear() < anioMin || edad > 120 || edad < 0) {
      this.fechaNacimientoError = 'La fecha de nacimiento no es válida';
    } else {
      this.fechaNacimientoError = '';
    }
  }

  validateEstadoCivil() {
    if (!this.estadoCivil) {
      this.estadoCivilError = 'Seleccione un estado civil';
    } else {
      this.estadoCivilError = '';
    }
  }

  createTurista() {
    this.validateName();
    this.validateEmail();
    this.validatePhone();
    this.validatePassword();
    this.validateConfirmPassword();
    this.validatePreferences();
    this.validateGenero();
    this.validateFechaNacimiento();
    this.validateEstadoCivil();
  
    if (!this.nameError && !this.emailError && !this.phoneError && !this.passwordError && 
      !this.confirmPasswordError && !this.generoError && !this.fechaNacimientoError && 
      !this.estadoCivilError) {
      this.isLoading = true;
  
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
  
      const turistaData = {
        nombre: this.name,
        correo: this.email,
        contraseña: this.password,
        telefono: this.phone.internationalNumber,
        ciudad: selectedCity,
        pais: this.selectedCountry,
        genero: this.genero,
        fechaNacimiento: formattedDate,
        estadoCivil: this.estadoCivil,
        foto: this.imagenPerfil || this.defaultImg
      };
  

      this.adminService.crearTurista(turistaData).subscribe({
        next: (response: any) => {
          const turistaId = response.id;
          const totalPreferencias = this.selectedPreferences.length;
          let asociadas = 0;
  
          if (totalPreferencias === 0) {
            this.isLoading = false;
            Swal.fire({
              icon: 'success',
              title: 'Turista creado',
              text: 'El turista fue creado exitosamente.',
              confirmButtonColor: '#4a9c9f'
            }).then(() => {
              this.router.navigate(['listado-turistas']);
            });
            return;
          }
  
          this.selectedPreferences.forEach((prefId: number) => {
            const turistaXPreferencia = {
              idUsuario: turistaId,
              preferencia: {
                _idPreferencias: prefId
              }
            };
  
            this.turistaXPreferencia.crear(turistaXPreferencia).subscribe({
              next: () => {
                asociadas++;
                if (asociadas === totalPreferencias) {
                  this.isLoading = false;
                  Swal.fire({
                    icon: 'success',
                    title: 'Turista creado',
                    text: 'El turista y sus preferencias fueron registrados correctamente.',
                    confirmButtonColor: '#4a9c9f'
                  }).then(() => {
                    this.router.navigate(['visitantes']);
                  });
                }
              },
              error: (error: any) => {
                console.error(`Error al asociar preferencia ${prefId}:`, error);
                asociadas++;
                if (asociadas === totalPreferencias) {
                  this.isLoading = false;
                  Swal.fire({
                    icon: 'warning',
                    title: 'Turista creado con advertencias',
                    text: 'El turista fue creado, pero algunas preferencias no se asociaron correctamente.',
                    confirmButtonColor: '#4a9c9f'
                  }).then(() => {
                    this.router.navigate(['listado-turistas']);
                  });
                }
              }
            });
          });
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Error al crear turista:', error);

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error en la creación del turista. Por favor, intente nuevamente.',
            confirmButtonColor: '#E82A3C'
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Formulario inválido',
        text: 'Corrige los errores antes de enviar el formulario.',
        confirmButtonColor: '#E82A3C'
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
