import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Route, RouteSelectionEvent } from '../../../../shared/models/route';
import { usuarios } from '../../../../shared/models/usuarios';
import { MakeNetworkingContactComponent } from '../../../../shared/ui/components/make-networking-contact/make-networking-contact.component';
import { ProviderServiceListContainerComponent } from '../../../../shared/ui/components/provider-service-list/provider-service-list.container';
import { ReviewDisplayComponent } from '../../../../shared/ui/components/review-display/review-display.component';
import { ReviewFormComponent } from '../../../../shared/ui/components/review-form/review-form.component';
import { RouteGenerationComponent } from '../../../../shared/ui/components/route-generation/route-generation.component';
import { ServicioService } from '../../../servicios/services/servicio.service';
import { ContactService } from '../../services/contact.service';
import { UsuarioService } from '../../services/usuario.service';


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

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReviewDisplayComponent,
    ReviewFormComponent,
    ProviderServiceListContainerComponent,
    MakeNetworkingContactComponent,
    RouteGenerationComponent
],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent implements OnInit, OnChanges, OnDestroy {
  @Input() providerId: number | null = null;
  @Input() showServiceManager = false;
  @Input() showNetworkingCard = false;
  @Input() showRouteGeneration = false;

  @Output() routeSelected = new EventEmitter<RouteSelectionEvent>();
  @Output() providerSelected = new EventEmitter<{ route: Route; provider: usuarios }>();

  provider: PlaceData | null = null;
  services: any[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  isAddingContact = false;
  isContact = false;
  currentUserId: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly usuarioService: UsuarioService,
    private readonly servicioService: ServicioService,
    private readonly authService: AuthService,
    private readonly contactService: ContactService
  ) {}

  private readonly destroy$ = new Subject<void>();
  private lastLoadedId: number | null = null;

  ngOnInit(): void {
    this.subscribeToContactState();
    this.authService
      .getCurrentUserId()
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.currentUserId = id;
        this.tryLoadContactState();
      });

    if (this.providerId !== null) {
      this.loadProviderDataIfNeeded(this.providerId);
      return;
    }

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const idFromRoute = Number(params.get('id'));

        if (idFromRoute) {
          this.loadProviderDataIfNeeded(idFromRoute);
        } else {
          this.resolveCurrentUserProfile();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('providerId' in changes) {
      const id = changes['providerId'].currentValue as number | null;

      if (id !== null && !changes['providerId'].firstChange) {
        this.loadProviderDataIfNeeded(id);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addContact(): void {
    if (!this.currentUserId || !this.provider) {
      console.error('No se puede añadir contacto: falta el ID del usuario actual o del proveedor.');
      return;
    }

    if (this.isAddingContact || this.isContact) {
      return;
    }

    this.contactService
      .addContact(this.currentUserId, this.provider.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Contacto añadido con éxito');
        },
        error: (err: unknown) => {
          console.error('Error al añadir contacto:', err);
        }
      });
  }

  private loadProviderDataIfNeeded(id: number): void {
    if (!id || id === this.lastLoadedId) {
      return;
    }

    this.lastLoadedId = id;
    this.contactService.resetContactState();
    this.requestProviderData(id);
  }

  private resolveCurrentUserProfile(): void {
    this.authService
      .getCurrentUserId()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: id => {
          if (id) {
            this.providerId = id;
            this.loadProviderDataIfNeeded(id);
          }
        },
        error: (err: unknown) => {
          console.error('No se pudo obtener el ID del usuario actual:', err);
        }
      });
  }

  private subscribeToContactState(): void {
    this.contactService.isAddingContact$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAdding: boolean) => {
        this.isAddingContact = isAdding;
      });

    this.contactService.isContact$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isContact: boolean) => {
        this.isContact = isContact;
      });
  }

  private requestProviderData(id: number): void {
    this.isLoading = true;
    this.error = null;

    this.usuarioService
      .obtenerPorIdPublico(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: userData => {
          console.log('Datos del usuario obtenidos:', userData);
          this.provider = this.mapUserToPlaceData(userData);
          this.tryLoadContactState(id);

          if (this.showServiceManager) {
            this.services = [];
            this.isLoading = false;
          } else {
            this.loadProviderServices(id);
          }
        },
        error: (err: unknown) => {
          console.error('Error al obtener datos del proveedor:', err);
          this.error = 'No se pudo cargar la información del proveedor.';
          this.isLoading = false;
        }
      });
  }

  private loadProviderServices(providerId: number): void {
    this.servicioService
      .obtenerServiciosPorProveedor(providerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (services: any) => {
          console.log('Servicios del proveedor:', services);
          this.services = services || [];
          this.isLoading = false;
        },
        error: (err: unknown) => {
          console.error('Error al obtener servicios:', err);
          this.services = [];
          this.isLoading = false;
        }
      });
  }

  private mapUserToPlaceData(userData: any): PlaceData {
    const proveedorInfo = userData.proveedorInfo || {};
    let totalReviews = 0;

    if (typeof proveedorInfo.total_resenas === 'number') {
      totalReviews = proveedorInfo.total_resenas;
    } else if (Array.isArray(proveedorInfo.resenas)) {
      totalReviews = proveedorInfo.resenas.length;
    }

    return {
      id: userData.id,
      name: proveedorInfo.nombre_empresa || userData.nombre || 'Empresa sin nombre',
      contactName: userData.nombre || 'Contacto sin nombre',
      email: userData.correo || 'email@ejemplo.com',
      foto: userData.foto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.nombre || 'U')}`,
      category: proveedorInfo.categoria || 'General',
      rating: 4.5, // Mock rating
      totalReviews,
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

  private tryLoadContactState(providerId?: number): void {
    if (!this.currentUserId) {
      return;
    }

    const targetProviderId = providerId ?? this.provider?.id;

    if (!targetProviderId) {
      return;
    }

    this.contactService
      .loadContactState(this.currentUserId, targetProviderId)
      .pipe(take(1))
      .subscribe({
        error: (err: unknown) => {
          console.error('No se pudo verificar el estado del contacto:', err);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/proveedor/home']);
  }

  startConversation(): void {
    this.router.navigate(['/proveedor/chat-demo']);
  }
}
