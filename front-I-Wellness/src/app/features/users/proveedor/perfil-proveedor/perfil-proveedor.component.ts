import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../admin/services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../services/usuario.service';
import { AuthorizationService } from '../../../../core/services/auth/authorization.service';
import { CountryISO, NgxIntlTelInputModule, PhoneNumberFormat, SearchCountryField} from 'ngx-intl-tel-input';
import * as L from 'leaflet';
import 'leaflet-control-geocoder';


@Component({
  selector: 'app-perfil-proveedor',
  imports: [CommonModule, FormsModule, RouterModule, NgxIntlTelInputModule],
  templateUrl: './perfil-proveedor.component.html',
  styleUrl: './perfil-proveedor.component.css'
})
export class PerfilProveedorComponent implements AfterViewInit {

  separateDialCode = false;
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.CostaRica, CountryISO.Colombia];
  telefonoObj: any;
  telefonoEmpresaObj: any;

  proveedor: any = {
    id: null,
    nombre: '',
    telefono: '',
    telefonoEmpresa: '',
    nombre_empresa: '',
    cargoContacto: '',
    coordenadaX: '',
    coordenadaY: '',
    foto: '',
    proveedorInfo: {
      telefono: '',
      telefonoEmpresa: '',
      nombre_empresa: '',
      cargoContacto: '',
      coordenadaX: '',
      coordenadaY: ''
    }
  };

  rol: string | null = null;
  isLoading: boolean = true;
  unauthorized: boolean = false;
  error: string = '';

  fotoPreview: string | ArrayBuffer | null = null;
  fotoSeleccionada: File | null = null;

  private map!: L.Map;
  private marker!: L.Marker;
  private mapInitialized = false;
  searchResults: any[] = [];


  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private usuarioService: UsuarioService,
    private router: Router,
    private authorizationService: AuthorizationService
  ) {}

  ngAfterViewInit(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.rol = localStorage.getItem('rol');
      this.verificarAccesoYCargarPerfil(id);
    });
  }

  ngAfterViewChecked(): void {
  if (!this.mapInitialized && !this.isLoading && !this.unauthorized) {
    const container = document.getElementById('reg-map');
    if (container) {
      this.mapInitialized = true;
      this.initMap();
      this.addMarkerAndFetchAddress();
    }
  }
}

  buscarDireccion(): void {
    const input = document.getElementById('direccionInput') as HTMLInputElement;
    const direccion = input.value;

    if (!direccion) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&countrycodes=cr`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          // Guardamos los resultados de búsqueda
          this.searchResults = data;

          // Tomamos el primer resultado
          const result = data[0]; 
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);

          this.map.setView([lat, lon], 16);

          if (this.marker) {
            this.marker.setLatLng([lat, lon]);
          } else {
            this.marker = L.marker([lat, lon]).addTo(this.map);
          }

          this.marker.bindPopup(`<b>${result.display_name}</b>`).openPopup();

          // Guardar coordenadas
          this.proveedor.proveedorInfo.coordenadaX = lat.toString();
          this.proveedor.proveedorInfo.coordenadaY = lon.toString();
        } else {
          alert('Dirección no encontrada');
        }
      })
      .catch(error => {
        console.error('Error al buscar dirección:', error);
        alert('Error al buscar dirección');
      });
  }

    handleResultSelection(event: any): void {
    const selectedValue = event.target.value;
    const selectedResult = this.searchResults.find(result => result.display_name === selectedValue);

    if (selectedResult) {
      const lat = parseFloat(selectedResult.lat);
      const lon = parseFloat(selectedResult.lon);

      this.map.setView([lat, lon], 16);

      if (this.marker) {
        this.marker.setLatLng([lat, lon]);
      } else {
        this.marker = L.marker([lat, lon]).addTo(this.map);
      }

      this.marker.bindPopup(`<b>${selectedResult.display_name}</b>`).openPopup();

      // Guardar coordenadas
      this.proveedor.proveedorInfo.coordenadaX = lat.toString();
      this.proveedor.proveedorInfo.coordenadaY = lon.toString();
    }
  }

private initMap(): void {
  const lat = parseFloat(this.proveedor.proveedorInfo.coordenadaX);
  const lon = parseFloat(this.proveedor.proveedorInfo.coordenadaY);

  this.map = L.map('reg-map').setView([lat, lon], 15);

   // Añadir capa base de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(this.map);

  if (!isNaN(lat) && !isNaN(lon)) {
    const customIcon = L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.marker = L.marker([lat, lon], { icon: customIcon }).addTo(this.map);
    this.map.setView([lat, lon], 13);

    // Obtener dirección
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
      .then(response => response.json())
      .then(data => {
        const placeName = data.display_name || 'Lugar no encontrado';
        this.marker.bindPopup(`<b>${placeName}</b>`).openPopup();
      });
  }

  // Evento click en el mapa para seleccionar nueva ubicación
  this.map.on('click', (e: L.LeafletMouseEvent) => {
    const newLat = e.latlng.lat;
    const newLon = e.latlng.lng;

    // Eliminar marcador anterior si existe
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    const customIcon = L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Añadir nuevo marcador
    this.marker = L.marker([newLat, newLon], { icon: customIcon }).addTo(this.map);

    // Obtener dirección
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLon}`)
      .then(response => response.json())
      .then(data => {
        const placeName = data.display_name || 'Lugar no encontrado';
        this.marker.bindPopup(`<b>${placeName}</b>`).openPopup();
      });

    // Actualizar coordenadas del proveedor
    this.proveedor.proveedorInfo.coordenadaX = newLat.toString();
    this.proveedor.proveedorInfo.coordenadaY = newLon.toString();
  });
}


private addMarkerAndFetchAddress(): void {
  const lat = parseFloat(this.proveedor.proveedorInfo.coordenadaX);
  const lon = parseFloat(this.proveedor.proveedorInfo.coordenadaY);

  // Definir un ícono personalizado
  const customIcon = L.icon({
    iconUrl: 'assets/leaflet/marker-icon.png',
    shadowUrl: 'assets/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Eliminar marcador anterior si ya existe
  if (this.marker) {
    this.map.removeLayer(this.marker);
  }

  // Crear nuevo marcador y guardarlo en this.marker
  this.marker = L.marker([lat, lon], { icon: customIcon }).addTo(this.map);

  // Obtener la dirección y mostrarla en el popup
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(data => {
      const placeName = data.display_name || 'Lugar no encontrado';
      this.marker.bindPopup(`<b>${placeName}</b>`).openPopup();
    })
    .catch(err => console.error(err));
}

  onTelefonoChange(event: any) {
    this.telefonoObj = event;
    if (event && event.nationalNumber) {
      this.proveedor.proveedorInfo.telefono = event.nationalNumber.replace(/\s+/g, '');
    } else {
      this.proveedor.proveedorInfo.telefono = '';
    }
  }

  onTelefonoEmpresaChange(event: any) {
    this.telefonoEmpresaObj = event;
    if (event && event.nationalNumber) {
      this.proveedor.proveedorInfo.telefonoEmpresa = event.nationalNumber.replace(/\s+/g, '');
    } else {
      this.proveedor.proveedorInfo.telefonoEmpresa = '';
    }
  }

  verificarAccesoYCargarPerfil(id: number) {
    this.isLoading = true;
    
    // Verificar si tiene acceso
    this.authorizationService.canAccessProfile(id).subscribe({
      next: (canAccess) => {
        if (canAccess) {
          this.cargarPerfil(id);
        } else {
          this.handleUnauthorizedAccess();
        }
      },
      error: (error) => {
        console.error('Error verificando acceso:', error);
        this.handleUnauthorizedAccess();
      }
    });
  }

  cargarPerfil(id: number) {
    if (this.rol === 'Admin') {
      this.adminService.obtenerUsuarioPorId(id).subscribe({
        next: (data: any) => {
          this.proveedor = data;
          console.log('Proveedor original (Admin):', this.proveedor);
          this.isLoading = false;
          this.unauthorized = false;
        },
        error: (error) => this.handleError(error)
      });
    } else if (this.rol === 'Proveedor') {
      this.usuarioService.obtenerPorId(id).subscribe({
        next: (data: any) => {
          this.proveedor = data;
          console.log('Proveedor original (Proveedor):', this.proveedor);
          this.isLoading = false;
          this.unauthorized = false;
        },
        error: (error) => this.handleError(error)
      });
    } else {
      console.warn('Rol no reconocido:', this.rol);
      this.handleUnauthorizedAccess();
    }
  }

  handleError(error: any) {
    console.error('Error:', error);
    this.isLoading = false;
    
    if (error.status === 403) {
      this.handleUnauthorizedAccess();
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

  handleUnauthorizedAccess() {
    this.unauthorized = true;
    this.isLoading = false;
    this.error = 'No tiene permiso para acceder a este perfil';
    
    Swal.fire({
      icon: 'error',
      title: 'Acceso denegado',
      text: 'No tiene permisos para ver este perfil',
      confirmButtonColor: '#E82A3C'
    }).then(() => {
      // Redirigir según el rol
      if (this.authorizationService.isProveedor()) {
        this.router.navigate(['/proveedor/home']);
      } else if (this.authorizationService.isTurista()) {
        this.router.navigate(['/turista/home']);
      } else if (this.authorizationService.isAdmin()) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  navigateTo(): void {
    if (this.authorizationService.isProveedor()) {
      this.router.navigate(['/proveedor/home']);
    } else if (this.authorizationService.isAdmin()) {
      this.router.navigate(['/proveedores']);
    } else {
      window.history.back();
    }
  }

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
        this.proveedor.foto = reader.result; 
      };
  
      reader.readAsDataURL(file); 
    }
  }

  guardarCambios(): void {
    const datosActualizar = {
      nombre: this.proveedor.nombre,
      telefono: this.telefonoObj.internationalNumber || '',
      telefonoEmpresa: this.telefonoEmpresaObj.internationalNumber || '',
      nombre_empresa: this.proveedor.proveedorInfo?.nombre_empresa || '',
      cargoContacto: this.proveedor.proveedorInfo?.cargoContacto || '',
      coordenadaX: this.proveedor.proveedorInfo?.coordenadaX || '',
      coordenadaY: this.proveedor.proveedorInfo?.coordenadaY || '',
      foto: this.proveedor.foto
    };

    if (this.rol === 'Admin') {
      this.adminService.actualizarProveedor(this.proveedor.id, datosActualizar)
        .subscribe(
          () => this.mostrarAlertaExito(),
          (error) => this.mostrarAlertaError(error)
        );
    } else if (this.rol === 'Proveedor') {
      this.usuarioService.editarProveedor(this.proveedor.id, datosActualizar)
        .subscribe(
          () => this.mostrarAlertaExito(),
          (error) => this.mostrarAlertaError(error)
        );
    } else {
      console.warn('Rol no reconocido al guardar:', this.rol);
    }
  }

  mostrarAlertaExito() {
    Swal.fire({
      title: '¡Proveedor actualizado!',
      text: 'La información del proveedor se ha actualizado correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#4a9c9f',
    });
  }

  mostrarAlertaError(error: any) {
    console.error('Error al actualizar el proveedor', error);
    Swal.fire({
      title: 'Error',
      text: 'Hubo un problema al actualizar el proveedor.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#4a9c9f',
    });
  }
}