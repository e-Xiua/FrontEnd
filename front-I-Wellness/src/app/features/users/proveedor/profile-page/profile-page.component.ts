import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ExtendedPlaceData } from '../../../../shared/models/place-data.model';
import { Route, RouteSelectionEvent } from '../../../../shared/models/route';
import { usuarios } from '../../../../shared/models/usuarios';
import { ChatIntegrationService } from '../../../../shared/services/chat-integration.service';
import { ChatLayoutService } from '../../../../shared/services/chat-layout.service';
import { ProfileStateService } from '../../../../shared/services/profile-state.service';
import { ProviderRatingDTO, ReviewsCallService } from '../../../../shared/services/reviews-call.service';
import { MakeNetworkingContactComponent } from '../../../../shared/ui/components/make-networking-contact/make-networking-contact.component';
import { ProviderServiceListContainerComponent } from '../../../../shared/ui/components/provider-service-list/provider-service-list.container';
import { ReviewDisplayComponent } from '../../../../shared/ui/components/review-display/review-display.component';
import { ReviewFormComponent } from '../../../../shared/ui/components/review-form/review-form.component';
import { RouteGenerationComponent } from '../../../../shared/ui/components/route-generation/route-generation.component';

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

  // Synchronous state for template (subscribed in ngOnInit)
  provider: ExtendedPlaceData | null = null;
  services: any[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  currentUserId: number | null = null;
  isContact = false;
  isAddingContact = false;
  isOwnProfile = false;
  currentUserRole: string | null = null;


  // Rating data
  providerRating: ProviderRatingDTO | null = null;
  address: string = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly profileState: ProfileStateService,
    private readonly reviewsService: ReviewsCallService,
    private readonly chatLayoutService: ChatLayoutService,
    private readonly authService: AuthService,
    private readonly chatIntegrationService: ChatIntegrationService
  ) {}

  // Reactive state from ProfileStateService (getter pattern for safe access)
  get provider$() { return this.profileState.provider$; }
  get services$() { return this.profileState.services$; }
  get isLoading$() { return this.profileState.isLoading$; }
  get error$() { return this.profileState.error$; }
  get currentUserId$() { return this.profileState.currentUserId$; }
  get isContact$() { return this.profileState.isContact$; }
  get isAddingContact$() { return this.profileState.isAddingContact$; }

  ngOnInit(): void {
    this.authService.userRole$.pipe(takeUntil(this.destroy$)).subscribe(role => {
      this.currentUserRole = role;
    });

    // Subscribe to all state changes - this ensures reactive updates
    this.profileState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // Preservar rating y totalReviews si ya los tenemos cargados
        const currentRating = this.provider?.rating;
        const currentTotalReviews = this.provider?.totalReviews;

        this.provider = state.provider;
        this.services = state.services;
        this.isLoading = state.isLoading;
        this.error = state.error;
        this.currentUserId = state.currentUserId;
        this.isContact = state.isContact;
        this.isAddingContact = state.isAddingContact;
        this.isOwnProfile = state.currentUserId !== null && state.targetProviderId !== null && state.currentUserId === state.targetProviderId;


        // Restaurar rating si ya lo teníamos cargado y el nuevo provider no tiene uno válido
        if (this.provider && this.providerRating) {
          if (!this.provider.rating || this.provider.rating === 0) {
            this.provider.rating = currentRating || this.parseRatingValue(this.providerRating.averageRating);
            this.provider.totalReviews = currentTotalReviews || this.providerRating.totalReviews;
          }
        }

        // Log state changes for debugging with detailed provider info
        console.log('📊 ProfilePage: State updated', {
          providerId: state.targetProviderId,
          isContact: state.isContact,
          isAddingContact: state.isAddingContact,
          hasProvider: !!state.provider,
          servicesCount: state.services?.length ?? 0
        });

        if (state.provider) {
          console.log('👤 Provider data received:', {
            id: state.provider.id,
            name: state.provider.name,
            contactName: state.provider.contactName,
            email: state.provider.correo,
            phone: state.provider.phone,
            companyPhone: state.provider.companyPhone,
            address: state.provider.address,
            hours: state.provider.hours,
            description: state.provider.description,
            cargoContacto: state.provider.cargoContacto,
            certificadosCalidad: state.provider.certificadosCalidad,
            identificacionFiscal: state.provider.identificacionFiscal,
            licenciasPermisos: state.provider.licenciasPermisos,
            category: state.provider.category,
            categories: state.provider.categories,
            rating: state.provider.rating,
            totalReviews: state.provider.totalReviews,
          });

          // Cargar dirección cuando el provider esté disponible
          if (state.provider.provider?.proveedorInfo) {
            this.loadAddressFromCoordinates();
          }

          // Cargar rating cuando tengamos el ID del proveedor (solo si no lo tenemos ya)
          if (!this.providerRating) {
            this.loadProviderRating(state.provider.id);
          }
        }
      });

    // Subscribe to route parameter changes to reload profile when navigating to different provider
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const idParam = params.get('id');
        if (idParam) {
          const newProviderId = Number(idParam);
          console.log('🔄 ProfilePage: Route param changed, loading provider ID:', newProviderId);

          // Update providerId if it comes from route
          if (!this.providerId || this.providerId !== newProviderId) {
            this.providerId = newProviderId;
            this.loadProvider();
          }
        } else if (this.providerId) {
          // If no route param but we have a providerId input, use that
          console.log('🔄 ProfilePage: Using @Input providerId:', this.providerId);
          this.loadProvider();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cargar el proveedor cuando el providerId cambia (incluyendo el primer cambio si viene como @Input)
    if ('providerId' in changes) {
      const currentId = changes['providerId'].currentValue;
      const previousId = changes['providerId'].previousValue;

      console.log('🔄 ProfilePage ngOnChanges:', {
        currentId,
        previousId,
        isFirstChange: changes['providerId'].firstChange
      });

      // Si es el primer cambio y tenemos un ID válido, o si el ID cambió
      if ((changes['providerId'].firstChange && currentId) ||
          (!changes['providerId'].firstChange && currentId !== previousId)) {
        this.loadProvider();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Don't reset state here - it will be cleared when loading a new provider
    // or when the user navigates away from provider profiles entirely
  }

  addContact(): void {
    this.profileState.addContact()
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    this.chatLayoutService.setActiveTab('contacts');
  }

  goBack(): void {
    this.router.navigate(['/proveedor/home']);
  }

  startChat(): void {
    if (this.provider) {
      this.chatIntegrationService.startConversationWithUser(this.provider);
    }
  }

  startConversation(): void {
    this.router.navigate(['/proveedor/chat-demo']);
  }

  viewMyContacts(): void {
    this.chatLayoutService.showModal();
    this.chatLayoutService.setActiveTab('contacts');
  }

  // ========== PRIVATE METHODS ==========

  private loadProvider(): void {
    // Load provider using service (handles route params or explicit ID)
    this.profileState.loadProvider(this.route, this.providerId);

    // Load services after provider is set
    this.profileState.loadServices(this.showServiceManager);

    // Load rating if provider ID is available
    if (this.providerId) {
      this.loadProviderRating(this.providerId);
    }
  }

  /**
   * Carga el rating promedio del proveedor desde la API de reviews
   */
  private loadProviderRating(providerId: number): void {
    console.log('🌟 Cargando rating para proveedor ID:', providerId);

    this.reviewsService.getProviderRating(providerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rating) => {
          this.providerRating = rating;
          console.log('✅ Rating cargado:', rating);
          console.log('📊 Rating details:', {
            averageRating: rating.averageRating,
            parsedValue: this.parseRatingValue(rating.averageRating),
            totalReviews: rating.totalReviews
          });

          // Actualizar el provider con el rating obtenido
          if (this.provider) {
            const parsedRating = this.parseRatingValue(rating.averageRating);
            this.provider.rating = parsedRating;
            this.provider.totalReviews = rating.totalReviews;

            console.log('✅ Provider rating actualizado:', {
              rating: this.provider.rating,
              totalReviews: this.provider.totalReviews
            });
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar rating:', error);
          // Mantener valores por defecto si falla
          this.providerRating = null;
          if (this.provider) {
            this.provider.rating = 0;
            this.provider.totalReviews = 0;
          }
        }
      });
  }

  /**
   * Parsea el valor de rating que puede venir como objeto {source, parsedValue} o número
   */
  private parseRatingValue(rating: any): number {
    if (typeof rating === 'number') {
      return rating;
    }
    if (rating && typeof rating === 'object' && 'parsedValue' in rating) {
      return rating.parsedValue;
    }
    return 0;
  }

  /**
   * Genera dirección a partir de coordenadas usando reverse geocoding
   */
  private loadAddressFromCoordinates(): void {
    if (!this.provider?.provider?.proveedorInfo) {
      return;
    }

    const lat = this.provider.provider.proveedorInfo.coordenadaX;
    const lon = this.provider.provider.proveedorInfo.coordenadaY;

    if (!lat || !lon) {
      this.address = 'Ubicación no disponible';
      return;
    }

    console.log('📍 Obteniendo dirección para coordenadas:', { lat, lon });

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          this.address = data.display_name;
          console.log('✅ Dirección obtenida:', this.address);

          // Actualizar el provider con la dirección
          if (this.provider) {
            this.provider.address = this.address;
          }
        } else {
          this.address = 'Dirección no disponible';
        }
      })
      .catch(error => {
        console.error('❌ Error al obtener dirección:', error);
        this.address = 'Error al obtener dirección';
      });
  }
}
