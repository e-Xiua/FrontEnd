import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ExtendedPlaceData } from '../../../../shared/models/place-data.model';
import { Route, RouteSelectionEvent } from '../../../../shared/models/route';
import { usuarios } from '../../../../shared/models/usuarios';
import { ProfileStateService } from '../../../../shared/services/profile-state.service';
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

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly profileState: ProfileStateService
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
    // Subscribe to all state changes - this ensures reactive updates
    this.profileState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.provider = state.provider;
        this.services = state.services;
        this.isLoading = state.isLoading;
        this.error = state.error;
        this.currentUserId = state.currentUserId;
        this.isContact = state.isContact;
        this.isAddingContact = state.isAddingContact;

        // Log state changes for debugging
        console.log('ProfilePage: State updated', {
          providerId: state.targetProviderId,
          isContact: state.isContact,
          isAddingContact: state.isAddingContact
        });
      });

    // Initial load
    this.loadProvider();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('providerId' in changes && !changes['providerId'].firstChange) {
      this.loadProvider();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.profileState.reset();
  }

  addContact(): void {
    this.profileState.addContact()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  goBack(): void {
    this.router.navigate(['/proveedor/home']);
  }

  startConversation(): void {
    this.router.navigate(['/proveedor/chat-demo']);
  }

  // ========== PRIVATE METHODS ==========

  private loadProvider(): void {
    // Load provider using service (handles route params or explicit ID)
    this.profileState.loadProvider(this.route, this.providerId);

    // Load services after provider is set
    this.profileState.loadServices(this.showServiceManager);
  }
}
