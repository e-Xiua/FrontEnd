import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import countriesData from '../../../../../assets/countries+cities.json';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import Swal from 'sweetalert2';
import { AuthorizationService } from '../../../../core/services/auth/authorization.service';
import { CountryISO, NgxIntlTelInputModule, PhoneNumberFormat, SearchCountryField} from 'ngx-intl-tel-input';

@Component({
  selector: 'app-perfil-turista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxIntlTelInputModule],
  templateUrl: './perfil-turista.component.html',
  styleUrl: './perfil-turista.component.css',
})
export class PerfilTuristaComponent implements OnInit {

  separateDialCode = false;
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.CostaRica, CountryISO.Colombia];
  telefonoObj: any;

  countriesData: any[] = countriesData;
  countries: string[] = [];
  cities: string[] = [];
  selectedCountry: string = '';
  selectedCity: string = '';
  isLoading: boolean = true;
  error: string = '';
  unauthorized: boolean = false;

  usuario: any = {
    id: null,
    nombre: '',
    foto: '',
    turistaInfo: {
      telefono: null,
      ciudad: '',
      pais: '',
      genero: '', 
      fechaNacimiento: '',
      estadoCivil: '',
    }
  };
  
  fotoPreview: string | ArrayBuffer | null = null;
  fotoSeleccionada: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioServicio: UsuarioService,
    private authorizationService: AuthorizationService
  ) {}

  formatearFecha(timestamp: number): string {
    if (!timestamp) return '';
    const fecha = new Date(timestamp);
    return fecha.toISOString().substring(0, 10); // Formato YYYY-MM-DD
  }
  

  ngOnInit() {
    this.countries = this.countriesData.map((country) => country.name);

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.cargarPerfil(id);
    });
  }

  onTelefonoChange(event: any) {
    this.telefonoObj = event;
    if (event && event.nationalNumber) {
      this.usuario.turistaInfo.telefono = event.nationalNumber.replace(/\s+/g, '');
    } else {
      this.usuario.turistaInfo.telefono = '';
    }
  }

  cargarPerfil(id: number) {
    this.isLoading = true;
    this.unauthorized = false;
    
    this.usuarioServicio.obtenerPorId(id).subscribe({
      next: (data) => {
        this.usuario = data;
        
        // Convertir el timestamp a formato YYYY-MM-DD para el input date
        if (this.usuario.turistaInfo && this.usuario.turistaInfo.fechaNacimiento) {
          const fechaTimestamp = this.usuario.turistaInfo.fechaNacimiento;
          
          if (typeof fechaTimestamp === 'string' || !isNaN(Number(fechaTimestamp))) {
            const fecha = new Date(fechaTimestamp);
            this.usuario.turistaInfo.fechaNacimiento = fecha.toISOString().slice(0, 10);
            this.usuario.turistaInfo.fechaNacimientoFormateada = fecha.toISOString().slice(0, 10);
            
          }
        }
        
        this.selectedCountry = this.usuario.turistaInfo?.pais;
        this.onCountryChange();
        this.selectedCity = this.usuario.turistaInfo?.ciudad;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al obtener perfil:', error);
        
        // Importante: poner isLoading en false cuando hay un error
        this.isLoading = false;
        
        if (error.status === 403) {
          this.unauthorized = true;
          this.error = 'No tiene permiso para acceder a este perfil';
          
          Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'No tiene permisos para ver este perfil',
            confirmButtonColor: '#E82A3C'
          }).then(() => {
            this.router.navigate(['/hometurista']);
          });
        } else if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.error = 'Error al cargar el perfil';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el perfil',
            confirmButtonColor: '#E82A3C'
          });
        }
      }
    });
  }

  // Resto de métodos existentes...
  
  seleccionarFoto(): void {
    const input = document.getElementById('fotoInput') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }
  
  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
  
      reader.onload = () => {
        this.fotoPreview = reader.result;
        this.usuario.foto = reader.result; 
      };
  
      reader.readAsDataURL(file); 
    }
  }

  onCountryChange() {
    const country = this.countriesData.find(
      (c) => c.name === this.selectedCountry
    );
    this.cities = country ? country.cities : [];
  }

  navigateTo() {
    if (this.authorizationService.isTurista()) {
      this.router.navigate(['/hometurista']);
    } else if (this.authorizationService.isAdmin()) {
      this.router.navigate(['/visitantes']);
    } else {
      window.history.back();
    }
  }

  guardarCambios(): void {
    // Convertir la fecha formateada a objeto Date para el backend
    let fechaNacimiento = null;
    
    if (this.usuario.turistaInfo.fechaNacimientoFormateada) {
      try {
        // Crear un objeto Date desde la cadena YYYY-MM-DD
        const fechaObj = new Date(this.usuario.turistaInfo.fechaNacimientoFormateada);
        fechaNacimiento = fechaObj.toISOString();
        console.log("Fecha a enviar:", fechaNacimiento);
      } catch (e) {
        console.error('Error al convertir fecha:', e);
      }
    }
  
    // Log para verificar estado civil antes de enviar
    console.log("Estado civil a enviar:", this.usuario.turistaInfo.estadoCivil);
  
    const datosActualizar = {
      nombre: this.usuario.nombre,
      telefono: this.telefonoObj.internationalNumber,
      ciudad: this.selectedCity,
      pais: this.selectedCountry,
      foto: this.usuario.foto,
      genero: this.usuario.turistaInfo.genero,
      fechaNacimiento: fechaNacimiento, // Usar la fecha convertida
      estadoCivil: this.usuario.turistaInfo.estadoCivil
    };
  
    console.log("Datos completos a enviar:", datosActualizar);
  
    this.usuarioServicio.editarTurista(this.usuario.id, datosActualizar)
      .subscribe({
        next: (response) => {
          console.log("Respuesta del servidor:", response);
          Swal.fire({
            icon: 'success',
            title: '¡Cambios guardados!',
            text: 'Tu perfil ha sido actualizado correctamente.',
            confirmButtonColor: '#4a9c9f'
          });
        },
        error: (error) => {
          console.error('Error al actualizar el usuario', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al actualizar tu perfil. Intenta de nuevo.',
            confirmButtonColor: '#E82A3C'
          });
        }
      });
  }

  cargarPerfilPorId(id: number) {
    this.usuarioServicio.obtenerPorId(id).subscribe({
      next: (data) => {
        this.usuario = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al obtener perfil:', error);
        
        if (error.status === 403) {
          // Usuario no tiene permiso
          this.unauthorized = true;
          this.error = 'No tiene permiso para acceder a este perfil';
        } else if (error.status === 401) {
          // Usuario no autenticado
          this.router.navigate(['/login']);
        } else {
          this.error = 'Error al cargar el perfil';
        }
        
        this.isLoading = false;
      }
    });
  }
  
  
}
