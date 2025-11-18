import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RouteGeneratorFullComponent } from "../../../../shared/components/route-generator-full/route-generator-full.component";
import { Route, RouteSelectionEvent } from '../../../../shared/models/route';
import { usuarios } from '../../../../shared/models/usuarios';
import { ProfileStateService } from '../../../../shared/services/profile-state.service';
import { RouteGenerationComponent } from "../../../../shared/ui/components/route-generation";

@Component({
  selector: 'app-generador-de-rutas-proveedor',
  imports: [RouteGeneratorFullComponent, RouteGenerationComponent],
  templateUrl: './generador-de-rutas-proveedor.component.html',
  styleUrl: './generador-de-rutas-proveedor.component.css'
})
export class GeneradorDeRutasProveedorComponent {

  @Input() showRouteGeneration = false;

  @Output() routeSelected = new EventEmitter<RouteSelectionEvent>();
  @Output() providerSelected = new EventEmitter<{ route: Route; provider: usuarios}>();

  // Synchronous state for template (subscribed in ngOnInit)
  currentUserId: number | null = null;

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
        this.currentUserId = state.currentUserId;
        // Log state changes for debugging
        console.log('ProfilePage: State updated', {
          providerId: state.targetProviderId,
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

  // ========== PRIVATE METHODS ==========

  private loadProvider(): void {
    // Load provider using service (handles route params or explicit ID)
    this.profileState.loadProvider(this.route, this.currentUserId);
  }

}
