/**
 * Profile State Service
 *
 * Centralized state management for provider profile viewing.
 * Handles:
 * - Loading provider data from route params or authenticated session
 * - Contact state management (add contact, check if already a contact)
 * - Service loading for the provider
 * - Reactive state with BehaviorSubjects
 *
 * Used by ProfilePageComponent to simplify its logic and make it a pure view component.
 */

import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth/auth.service';
import { ServicioService } from '../../features/servicios/services/servicio.service';
import { UsuarioService } from '../../features/users/services/usuario.service';
import { mapUsuarioToExtendedPlaceData } from '../adapters/provider-data.adapter';
import { ExtendedPlaceData } from '../models/place-data.model';
import { usuarios } from '../models/usuarios';

interface ProfileState {
  provider: ExtendedPlaceData | null;
  services: any[];
  isLoading: boolean;
  error: string | null;
  currentUserId: number | null;
  targetProviderId: number | null;
  isContact: boolean;
  isAddingContact: boolean;
}

/**
 * Event emitted when a new contact is successfully added
 */
export interface ContactAddedEvent {
  userId: number;
  contactId: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileStateService {
  // ========== PRIVATE STATE ==========
  private readonly _state$ = new BehaviorSubject<ProfileState>({
    provider: null,
    services: [],
    isLoading: false,
    error: null,
    currentUserId: null,
    targetProviderId: null,
    isContact: false,
    isAddingContact: false
  });

  // Event stream for contact additions
  private readonly _contactAdded$ = new BehaviorSubject<ContactAddedEvent | null>(null);

  // ========== PUBLIC OBSERVABLES ==========
  public readonly state$ = this._state$.asObservable();
  public readonly provider$ = this.state$.pipe(map(s => s.provider));
  public readonly services$ = this.state$.pipe(map(s => s.services));
  public readonly isLoading$ = this.state$.pipe(map(s => s.isLoading));
  public readonly error$ = this.state$.pipe(map(s => s.error));
  public readonly currentUserId$ = this.state$.pipe(map(s => s.currentUserId));
  public readonly isContact$ = this.state$.pipe(map(s => s.isContact));
  public readonly isAddingContact$ = this.state$.pipe(map(s => s.isAddingContact));

  /**
   * Emits when a new contact is successfully added
   * Components can subscribe to this to refresh their contact lists
   */
  public readonly contactAdded$ = this._contactAdded$.asObservable();

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly servicioService: ServicioService,
    private readonly authService: AuthService
  ) {
    // Initialize current user ID on service creation
    this.authService.getCurrentUserId()
      .pipe(take(1))
      .subscribe(id => {
        this.updateState({ currentUserId: id });
      });
  }

  /**
   * Load provider profile by resolving ID from route params or authenticated session
   * @param route ActivatedRoute to extract ID from params
   * @param explicitProviderId Optional explicit provider ID to override route/session resolution
   */
  loadProvider(route: ActivatedRoute | null, explicitProviderId?: number | null): void {
    this.updateState({ isLoading: true, error: null });

    // Priority: explicit ID > route param > authenticated user
    if (explicitProviderId !== undefined && explicitProviderId !== null) {
      this.fetchProviderData(explicitProviderId);
      return;
    }

    if (route) {
      route.paramMap.pipe(
        take(1),
        map(params => {
          const idParam = params.get('id');
          return idParam ? Number(idParam) : null;
        })
      ).subscribe(idFromRoute => {
        if (idFromRoute) {
          this.fetchProviderData(idFromRoute);
        } else {
          this.resolveFromAuthenticatedUser();
        }
      });
    } else {
      this.resolveFromAuthenticatedUser();
    }
  }

  /**
   * Load services for the currently loaded provider
   * @param showServiceManager If true, services array will be empty (managed elsewhere)
   */
  loadServices(showServiceManager: boolean = false): void {
    const providerId = this._state$.value.targetProviderId;

    if (!providerId || showServiceManager) {
      this.updateState({ services: [], isLoading: false });
      return;
    }

    this.servicioService.obtenerServiciosPorProveedor(providerId)
      .pipe(
        catchError(err => {
          console.error('Error al obtener servicios:', err);
          return of([]);
        }),
        finalize(() => this.updateState({ isLoading: false }))
      )
      .subscribe(services => {
        this.updateState({ services: services || [] });
      });
  }

  /**
   * Check if current user has the target provider as a contact
   * This method queries the backend to verify the current contact state
   */
  loadContactState(): void {
    const { currentUserId, targetProviderId } = this._state$.value;

    if (!currentUserId || !targetProviderId || currentUserId === targetProviderId) {
      this.updateState({ isContact: false });
      console.log('ProfileStateService: Cannot check contact state - viewing own profile or missing IDs');
      return;
    }

    console.log('ProfileStateService: Checking contact state...', { currentUserId, targetProviderId });

    this.usuarioService.getContacts(currentUserId)
      .pipe(
        map(contacts => this.contactExists(contacts, targetProviderId)),
        catchError(err => {
          console.error('ProfileStateService: Error checking contact state:', err);
          return of(false);
        })
      )
      .subscribe(isContact => {
        this.updateState({ isContact });
        console.log('ProfileStateService: Contact state loaded:', isContact);
      });
  }

  /**
   * Add the current provider to the authenticated user's contacts
   * Returns an observable that completes when the operation finishes
   * State updates happen reactively during the process
   * Emits a contactAdded$ event on success for other components to react
   */
  addContact(): Observable<void> {
    const { currentUserId, targetProviderId, isAddingContact, isContact } = this._state$.value;

    if (!currentUserId || !targetProviderId || isAddingContact || isContact) {
      console.warn('ProfileStateService: Cannot add contact - invalid state', {
        currentUserId,
        targetProviderId,
        isAddingContact,
        isContact
      });
      return of(void 0);
    }

    // Immediately update UI to show loading state
    this.updateState({ isAddingContact: true });
    console.log('ProfileStateService: Adding contact...', { currentUserId, targetProviderId });

    return this.usuarioService.addContact(currentUserId, targetProviderId).pipe(
      tap(() => {
        // Immediately update state to reflect success
        this.updateState({
          isContact: true,
          isAddingContact: false
        });

        // Emit event for other components (e.g., chat-sidebar) to refresh
        this._contactAdded$.next({
          userId: currentUserId,
          contactId: targetProviderId,
          timestamp: new Date()
        });

        console.log('ProfileStateService: ✅ Contact added successfully - state updated & event emitted');
      }),
      catchError(err => {
        console.error('ProfileStateService: ❌ Error adding contact:', err);
        // Reset loading state on error
        this.updateState({ isAddingContact: false });
        return of(void 0);
      })
    );
  }  /**
   * Reset the service state
   */
  reset(): void {
    this._state$.next({
      provider: null,
      services: [],
      isLoading: false,
      error: null,
      currentUserId: this._state$.value.currentUserId, // Keep current user ID
      targetProviderId: null,
      isContact: false,
      isAddingContact: false
    });
  }

  /**
   * Get contacts for the current authenticated user
   * Returns an Observable of raw contact data (usuarios[])
   */
  getContacts(): Observable<usuarios[]> {
    const currentUserId = this._state$.value.currentUserId;

    if (!currentUserId) {
      // Try to get from auth service if not in state
      return this.authService.getCurrentUserId().pipe(
        take(1),
        tap(id => {
          if (id) {
            this.updateState({ currentUserId: id });
          }
        }),
        switchMap(id => {
          if (!id) {
            console.error('ProfileStateService: No se pudo obtener el ID del usuario autenticado');
            return of([]);
          }
          return this.usuarioService.getContacts(id);
        }),
        catchError(err => {
          console.error('ProfileStateService: Error al obtener contactos:', err);
          return of([]);
        })
      );
    }

    return this.usuarioService.getContacts(currentUserId).pipe(
      catchError(err => {
        console.error('ProfileStateService: Error al obtener contactos:', err);
        return of([]);
      })
    );
  }

  // ========== PRIVATE METHODS ==========

  private resolveFromAuthenticatedUser(): void {
    this.authService.getCurrentUserId()
      .pipe(take(1))
      .subscribe({
        next: id => {
          if (id) {
            this.fetchProviderData(id);
          } else {
            this.updateState({
              error: 'No se pudo obtener el ID del usuario actual',
              isLoading: false
            });
          }
        },
        error: err => {
          console.error('Error obteniendo ID del usuario:', err);
          this.updateState({
            error: 'Error al obtener el usuario actual',
            isLoading: false
          });
        }
      });
  }

  private fetchProviderData(providerId: number): void {
    this.updateState({ targetProviderId: providerId });

    this.usuarioService.obtenerPorIdPublico(providerId)
      .pipe(
        catchError(err => {
          console.error('Error al obtener datos del proveedor:', err);
          this.updateState({
            error: 'No se pudo cargar la información del proveedor.',
            isLoading: false
          });
          throw err;
        })
      )
      .subscribe({
        next: (userData: usuarios) => {
          console.log('Datos del usuario obtenidos:', userData);
          const provider = mapUsuarioToExtendedPlaceData(userData);
          this.updateState({ provider });

          // After loading provider, check contact state
          this.loadContactState();
        }
      });
  }

  private contactExists(contacts: any[], contactId: number): boolean {
    return contacts.some(contact => {
      if (!contact || typeof contact !== 'object') {
        return false;
      }

      return (
        contact.id === contactId ||
        contact.contactId === contactId ||
        contact.contactoId === contactId
      );
    });
  }

  private updateState(partial: Partial<ProfileState>): void {
    this._state$.next({
      ...this._state$.value,
      ...partial
    });
  }
}
