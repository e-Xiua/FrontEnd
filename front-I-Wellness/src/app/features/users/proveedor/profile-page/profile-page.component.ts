import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

import { ServicioService } from '../../../servicios/services/servicio.service';

interface PlaceData {
  id: number;
  name: string;
  contactName: string;
  email: string;
  foto?: string | null;
  category: string;
  rating: number;
  totalReviews: number;
  address: string;
  hours: string;
  description: string;
  phone: string;
  companyPhone: string;
  cargoContacto: string;
  certificadosCalidad?: string[] | null;
  identificacionFiscal?: string | null;
  licenciasPermisos?: string[] | null;
}

interface Review {
  id: number;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
  helpful: number;
  notHelpful: number;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent implements OnInit {
  provider: PlaceData | null = null;
  services: any[] = [];
  reviews: Review[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  // Mock reviews data (since we don't have this in the backend yet)
  mockReviews: Review[] = [
    {
      id: 1,
      author: 'Laura González',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura',
      date: '2024-10-01',
      rating: 5,
      comment: 'Excelente servicio, muy profesional y puntual. Definitivamente lo recomiendo.',
      helpful: 12,
      notHelpful: 0
    },
    {
      id: 2,
      author: 'Carlos Méndez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
      date: '2024-09-28',
      rating: 4,
      comment: 'Muy buen servicio, aunque el tiempo de respuesta podría mejorar un poco.',
      helpful: 8,
      notHelpful: 1
    },
    {
      id: 3,
      author: 'Ana Patricia',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
      date: '2024-09-25',
      rating: 5,
      comment: 'Increíble experiencia, superó todas mis expectativas. ¡Volveré sin duda!',
      helpful: 15,
      notHelpful: 0
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private servicioService: ServicioService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProviderData(id);
      }
    });
  }

  private loadProviderData(id: number): void {
    this.isLoading = true;
    this.error = null;

    this.usuarioService.obtenerPorId(id).subscribe({
      next: (userData) => {
        console.log('Datos del usuario obtenidos:', userData);
        this.provider = this.mapUserToPlaceData(userData);
        this.reviews = this.mockReviews; // Using mock reviews
        this.loadProviderServices(id);
      },
      error: (err) => {
        console.error('Error al obtener datos del proveedor:', err);
        this.error = 'No se pudo cargar la información del proveedor.';
        this.isLoading = false;
      }
    });
  }

  private loadProviderServices(providerId: number): void {
    this.servicioService.obtenerServiciosPorProveedor(providerId).subscribe({
      next: (services: any) => {
        console.log('Servicios del proveedor:', services);
        this.services = services || [];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al obtener servicios:', err);
        this.services = [];
        this.isLoading = false;
      }
    });
  }

  private mapUserToPlaceData(userData: any): PlaceData {
    const proveedorInfo = userData.proveedorInfo || {};

    return {
      id: userData.id,
      name: proveedorInfo.nombre_empresa || userData.nombre || 'Empresa sin nombre',
      contactName: userData.nombre || 'Contacto sin nombre',
      email: userData.correo || 'email@ejemplo.com',
      foto: userData.foto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.nombre || 'U')}`,
      category: proveedorInfo.categoria || 'General',
      rating: 4.5, // Mock rating
      totalReviews: this.mockReviews.length,
      address: proveedorInfo.direccion || 'Dirección no disponible',
      hours: proveedorInfo.horario || 'Lunes a Viernes 9:00 AM - 6:00 PM',
      description: proveedorInfo.descripcion || 'Proveedor de servicios profesionales con amplia experiencia en el sector.',
      phone: proveedorInfo.telefono || 'No disponible',
      companyPhone: proveedorInfo.telefono_empresa || proveedorInfo.telefono || 'No disponible',
      cargoContacto: proveedorInfo.cargo_contacto || 'Representante',
      certificadosCalidad: proveedorInfo.certificados_calidad || null,
      identificacionFiscal: proveedorInfo.identificacion_fiscal || null,
      licenciasPermisos: proveedorInfo.licencias_permisos || null
    };
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/proveedor/home']);
  }

  startConversation(): void {
    this.router.navigate(['/proveedor/chat-demo']);
  }
}
