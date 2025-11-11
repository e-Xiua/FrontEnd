import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, of, shareReplay, Subject, takeUntil } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';

import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ChatProvider } from '../../../../shared/models/chat';
import { AnimationContext, AnimationStrategyFactory } from '../../../../shared/services/animation-strategy.service';
import { ChatLayoutService } from '../../../../shared/services/chat-layout.service';
import { ChatRealtimeService } from '../../../../shared/services/chat-realtime.service';
import { ProfileStateService } from '../../../../shared/services/profile-state.service';
import { ProviderMapperService } from '../../../../shared/services/provider-mapper.service';
import { ContactCardComponent } from '../../../../shared/ui/components/contact/contact-card/contact-card.component';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    ContactCardComponent
  ],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.css'
})
export class ChatSidebarComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly contactsReload$ = new Subject<void>();
  private readonly paginationState$ = new BehaviorSubject<{ pageIndex: number; pageSize: number }>({ pageIndex: 0, pageSize: 10 });
  private readonly loadingState$ = new BehaviorSubject<boolean>(false);
  private readonly errorState$ = new BehaviorSubject<string | null>(null);
  private currentProviderIds = new Set<number>();

  private readonly chatLayoutService = inject(ChatLayoutService);
  private readonly chatRealtimeService = inject(ChatRealtimeService);
  private readonly providerMapperService = inject(ProviderMapperService);
  private readonly profileStateService = inject(ProfileStateService);
  private readonly router = inject(Router);
  private readonly animationFactory = inject(AnimationStrategyFactory);
  private readonly animationContext = inject(AnimationContext);
  private readonly authService = inject(AuthService);

  layoutState$ = this.chatLayoutService.state$;
  isVisible$ = this.chatLayoutService.state$.pipe(map(state => state.sidebarVisible));
  realtimeState$ = this.chatRealtimeService.state$;

  searchControl = new FormControl('');
  sortControl = new FormControl('name');
  filterControl = new FormControl('all');

  readonly isLoading$ = this.loadingState$.asObservable();
  readonly error$ = this.errorState$.asObservable();

  private readonly filterCriteria$ = combineLatest([
    this.searchControl.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
    this.sortControl.valueChanges.pipe(startWith('name')),
    this.filterControl.valueChanges.pipe(startWith('all'))
  ]);

  readonly contacts$ = this.contactsReload$.pipe(
    startWith(void 0),
    tap(() => {
      this.loadingState$.next(true);
      this.errorState$.next(null);
      console.log('ChatSidebar: Iniciando carga de contactos usando ProfileStateService');
    }),
    switchMap(() =>
      this.profileStateService.getContacts().pipe(
        tap(contacts => console.log('ChatSidebar: Contactos obtenidos:', contacts?.length || 0)),
        catchError(error => {
          console.error('ChatSidebar: Error loading contacts:', error);
          this.errorState$.next('Error al cargar tus contactos. Intenta nuevamente.');
          return of([]);
        }),
        finalize(() => {
          this.loadingState$.next(false);
          console.log('ChatSidebar: Carga de contactos finalizada');
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly providers$ = this.contacts$.pipe(
    map(contacts => contacts.map(contact => this.providerMapperService.mapUsuarioToChatProvider(contact)))
  );

  readonly filteredProviders$ = combineLatest([this.providers$, this.filterCriteria$]).pipe(
    map(([providers, [search, sort, filter]]) =>
      this.filterProviders(providers, search || '', sort || 'name', filter || 'all')
    ),
    tap(() => {
      const current = this.paginationState$.value;
      if (current.pageIndex !== 0) {
        this.paginationState$.next({ pageIndex: 0, pageSize: current.pageSize });
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly paginatedProviders$ = combineLatest([this.filteredProviders$, this.paginationState$]).pipe(
    map(([providers, { pageIndex, pageSize }]) => {
      const startIndex = pageIndex * pageSize;
      return providers.slice(startIndex, startIndex + pageSize);
    })
  );

  readonly totalProviders$ = this.filteredProviders$.pipe(map(providers => providers.length));
  readonly pageState$ = this.paginationState$.asObservable();

  sortOptions = [
    { value: 'name', label: 'Nombre A-Z' },
    { value: 'rating', label: 'Mejor rating' },
    { value: 'recent', label: 'Más reciente' },
    { value: 'services', label: 'Más servicios' }
  ];

  filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'online', label: 'En línea' },
    { value: 'favorites', label: 'Favoritos' },
    { value: 'recent', label: 'Recientes' }
  ];

  ngOnInit(): void {
    this.setupAnimations();
    this.setupRealtimeUpdates();

    this.providers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(providers => {
        this.currentProviderIds = new Set(providers.map(provider => provider.id));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.contactsReload$.complete();
    this.paginationState$.complete();
    this.loadingState$.complete();
    this.errorState$.complete();
    this.chatRealtimeService.disconnect();
  }

  onPageChange(event: PageEvent): void {
    this.paginationState$.next({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  onProviderSelect(provider: ChatProvider): void {
    this.selectedProvider = provider;
  }

  onProviderChat(provider: ChatProvider): void {
    this.selectedProvider = provider;
  }

  onProviderProfile(provider: ChatProvider): void {
    this.router.navigate(['/proveedor/ver-perfil/', provider.id]);
  }

  onToggleSidebar(): void {
    this.chatLayoutService.toggleSidebar();
  }

  onClearSearch(): void {
    this.searchControl.setValue('');
  }

  onRefresh(): void {
    if (this.loadingState$.value) {
      console.log('ChatSidebar: Refresh ya en progreso, ignorando solicitud');
      return;
    }

    console.log('ChatSidebar: Iniciando refresh manual de proveedores');
    this.chatRealtimeService.forceRefresh().subscribe({
      next: () => {
        console.log('ChatSidebar: Actualización en tiempo real completada');
        this.contactsReload$.next();
      },
      error: err => {
        console.error('ChatSidebar: Error en refresh en tiempo real:', err);
        this.contactsReload$.next();
      }
    });
  }

  private setupAnimations(): void {
    const strategy = this.animationFactory.createStrategy('slide');
    this.animationContext.setStrategy(strategy);
  }

  private setupRealtimeUpdates(): void {
    console.log('ChatSidebar: Configurando actualizaciones en tiempo real');

    const userId = this.authService.getCurrentUserIdSynchronous();
    if (!userId) {
      console.warn('ChatSidebar: No hay usuario autenticado, saltando setup de tiempo real');
      return;
    }

    this.chatLayoutService.initializeChatData();
    this.chatRealtimeService.connect();

    this.profileStateService.contactAdded$
      .pipe(
        takeUntil(this.destroy$),
        tap(event => {
          if (event) {
            console.log('ChatSidebar: 🎉 Contacto agregado detectado desde perfil:', event);
            this.contactsReload$.next();
          }
        })
      )
      .subscribe();

    this.chatRealtimeService.newContacts$
      .pipe(
        takeUntil(this.destroy$),
        tap(newContacts => {
          if (newContacts.length > 0) {
            console.log('ChatSidebar: 🔔 Nuevos contactos detectados:', newContacts.length);
            this.contactsReload$.next();
          }
        })
      )
      .subscribe();

    this.chatRealtimeService.newMessages$
      .pipe(
        takeUntil(this.destroy$),
        tap(conversations => {
          if (conversations.length > 0) {
            console.log('ChatSidebar: 🔔 Nuevas conversaciones detectadas:', conversations.length);
            this.checkForNewContacts(conversations);
          }
        })
      )
      .subscribe();
  }

  private checkForNewContacts(conversations: any[]): void {
    for (const conv of conversations) {
      const otherParticipant = conv.otherParticipant || conv.participant;
      if (otherParticipant && !this.currentProviderIds.has(otherParticipant.id)) {
        console.log('ChatSidebar: Nuevo contacto detectado de conversación:', otherParticipant);
        this.contactsReload$.next();
        break;
      }
    }
  }

  private filterProviders(providers: ChatProvider[], search: string, sort: string, filter: string): ChatProvider[] {
    let filtered = [...providers];
    const searchLower = search.trim().toLowerCase();

    if (searchLower) {
      filtered = filtered.filter(provider =>
        provider.nombre.toLowerCase().includes(searchLower) ||
        provider.contactName.toLowerCase().includes(searchLower) ||
        provider.services.some(service => service.name.toLowerCase().includes(searchLower))
      );
    }

    switch (filter) {
      case 'online':
        filtered = filtered.filter(provider => provider.isOnline);
        break;
      case 'favorites':
        break;
      case 'recent':
        filtered = filtered.filter(provider =>
          provider.lastSeen &&
          new Date(provider.lastSeen).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );
        break;
    }

    switch (sort) {
      case 'name':
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case 'services':
        filtered.sort((a, b) => b.services.length - a.services.length);
        break;
    }

    return filtered;
  }

  getAnimationClass(index: number): string {
    const delay = index * 50;
    return `animate-slide-in animation-delay-${delay}`;
  }

  trackByProvider(index: number, provider: ChatProvider): number {
    return provider.id;
  }

  selectedProvider: ChatProvider | null = null;
}
