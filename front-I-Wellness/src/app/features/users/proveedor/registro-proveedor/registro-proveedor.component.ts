import { Component,AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';
import * as L from 'leaflet';
import { CountryISO, NgxIntlTelInputModule, PhoneNumberFormat, SearchCountryField} from 'ngx-intl-tel-input';


@Component({
  selector: 'app-registro-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxIntlTelInputModule],
  templateUrl: './registro-proveedor.component.html',
  styleUrl: './registro-proveedor.component.css'
})
export class RegistroProveedorComponent implements AfterViewInit {

  separateDialCode = false;
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.CostaRica, CountryISO.Colombia];

  // Form fields
  name: string = '';
  contactPosition: string = '';
  phone: any = '';
  password: string = '';
  confirmPassword: string = '';
  companyName: string = '';
  email: string = '';
  companyNamePhone: any = '';
  coordinateX: string = '';
  coordinateY: string = '';
  foto: string = '';  // Aquí se guardará la imagen como base64


  // Error variables
  nameError: string = '';
  contactPositionError: string = '';
  phoneError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';
  companyNameError: string = '';
  emailError: string = '';
  companyNamePhoneError: string = '';
  coordinateXError: string = '';
  coordinateYError: string = '';
  fotoError: string = '';


  isLoading: boolean = false;

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;


  //map
  private map!: L.Map;
  private marker!: L.Marker;
  searchQuery: string = '';
  searchResults: any[] = [];
  selectedResult: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngAfterViewInit(): void {

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });
    this.initMap();
        
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
private initMap(): void {
    // … código previo …
    this.map = L.map('reg-map').setView([10.5, -84.7], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(this.map);

    this.marker = L.marker([0, 0], { draggable: true })
      .addTo(this.map)
      .setOpacity(0);

    // Click en mapa → mueve marker + actualiza inputs
    this.map.on('click', (e) => {
      this.moveMarkerAndUpdateInputs(e.latlng.lat, e.latlng.lng);
    });

    // Drag del marker → actualiza inputs
    this.marker.on('dragend', () => {
      const { lat, lng } = this.marker.getLatLng();
      this.moveMarkerAndUpdateInputs(lat, lng);
    });
  }

  searchLocation() {
  if (!this.searchQuery) return;

const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}&addressdetails=1&limit=5&countrycodes=cr`;

  fetch(url, {
    headers: {
      'User-Agent': 'I-Wellness-App (tucorreo@example.com)'  // Nominatim requiere esto
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        this.searchResults = data;
      } else {
        this.searchResults = [];
        Swal.fire('No encontrado', 'No se encontraron resultados para tu búsqueda.', 'info');
      }
    })
    .catch(err => {
      console.error('Error buscando ubicación:', err);
      Swal.fire('Error', 'Ocurrió un error al buscar la dirección.', 'error');
    });
}

handleResultSelection(event: any) {
  const selected = this.searchResults.find(r => r.display_name === event.target.value);
  if (selected) {
    const lat = parseFloat(selected.lat);
    const lon = parseFloat(selected.lon);
    this.coordinateX = lat.toFixed(6);
    this.coordinateY = lon.toFixed(6);
    this.moveMarkerAndUpdateInputs(lat, lon);
    this.searchResults = []; // Limpiar opciones
  }
  }

  /** centraliza movimiento y actualización de inputs */
  private moveMarkerAndUpdateInputs(lat: number, lng: number) {
    this.marker
      .setLatLng([lat, lng])
      .setOpacity(1);

    this.map.panTo([lat, lng]);

    this.coordinateX = lat.toFixed(6);
    this.coordinateY = lng.toFixed(6);

    this.validatecoordinateX();
    this.validatecoordinateY();
  }

  /** se dispara cuando cambias a mano las coordenadas */
  onInputCoordsChange() {
    const lat = parseFloat(this.coordinateX);
    const lng = parseFloat(this.coordinateY);
    this.validatecoordinateX();
    this.validatecoordinateY();

    if (!isNaN(lat) && !isNaN(lng)) {
      // mueve el marker y centra el mapa
      this.marker
        .setLatLng([lat, lng])
        .setOpacity(1);
      this.map.panTo([lat, lng]);
    }
  }
  // Validación del formulario antes de registrar
  validateForm(): boolean {
    this.validateName();
    this.validatecontactPosition();
    this.validatePhone();
    this.validatePassword();
    this.validateConfirmPassword();
    this.validatecompanyName();
    this.validateEmail();
    this.validatecompanyNamePhone();
    this.validatecoordinateX();
    this.validatecoordinateY();
    this.validateFoto(); 

    return !this.hasErrors();
  }

  // Validaciones
  validateName() {
    this.nameError = this.name.trim() ? '' : 'El nombre es obligatorio';
  }

  validatecontactPosition() {
    this.contactPositionError = this.contactPosition.trim() ? '' : 'El cargo de contacto es obligatorio';
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
    this.passwordError = this.password.length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres';
  }

  validateConfirmPassword() {
    this.confirmPasswordError = this.password === this.confirmPassword ? '' : 'Las contraseñas no coinciden';
  }

  validatecompanyName() {
    this.companyNameError = this.companyName.trim() ? '' : 'Ingrese el nombre de la empresa';
  }

  validateEmail() {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.emailError = this.email.match(regex) ? '' : 'Ingrese un correo electrónico válido';
  }

  validatecompanyNamePhone() {
    const phoneNumber = this.companyNamePhone.internationalNumber;
    const regex = /^\+?\s?[0-9\s]{7,15}$/;
    if (!phoneNumber.match(regex)) {
      this.companyNamePhoneError = 'El teléfono solo puede contener números (7 a 15 dígitos)';
    } else {
      this.companyNamePhoneError = '';
    }
  }

  validatecoordinateX() {
    const coordinateRegex = /^-?\d{1,3}\.\d+$/;
    this.coordinateXError = this.coordinateX.match(coordinateRegex) ? '' : 'Ingrese la coordenada X correctamente';
  }

  validatecoordinateY() {
    const coordinateRegex = /^-?\d{1,3}\.\d+$/;
    this.coordinateYError = this.coordinateY.match(coordinateRegex) ? '' : 'Ingrese la coordenada Y correctamente';
  }

  validateFoto() {
  this.fotoError = this.foto ? '' : 'Debe subir una imagen.';
}

  // Verifica si hay errores para deshabilitar el botón
hasErrors(): boolean {
  return !!(
    this.nameError ||
    this.contactPositionError ||
    this.phoneError ||
    this.passwordError ||
    this.confirmPasswordError ||
    this.companyNameError ||
    this.emailError ||
    this.companyNamePhoneError ||
    this.coordinateXError ||
    this.coordinateYError ||
    this.fotoError
  );
}

  register() {
    if (this.validateForm()) {
      this.isLoading = true;
  
      const providerData = {
        nombre: this.name,
        cargoContacto: this.contactPosition,
        telefono: this.phone.internationalNumber,
        contraseña: this.password,
        nombre_empresa: this.companyName,
        correo: this.email,
        telefonoEmpresa: this.companyNamePhone.internationalNumber,
        coordenadaX: this.coordinateX || '0',
        coordenadaY: this.coordinateY || '0',
        foto: this.foto
      };
  
      this.authService.registerProveedor(providerData).subscribe({
        next: (response) => {
          this.isLoading = false;          
          // El token ya está guardado por el servicio de auth
          // Redirigir directamente al home del proveedor
          this.router.navigate(['/homeproveedor']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en el registro:', error);
          Swal.fire({
                        title: 'Error',
                        text: 'Este correo electrónico ya está registrado. Por favor, usa otro.',
                        icon: 'error',
                        confirmButtonColor: '#d33',
                        confirmButtonText: 'Aceptar'
                      });
          if (error.error && error.error.includes('correo ya está registrado')) {
            this.emailError = 'Este correo electrónico ya está registrado';
          }
        }
      });
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      this.foto = reader.result as string;
      this.fotoError = ''; 
    };
    reader.readAsDataURL(file);
  }
}

}
