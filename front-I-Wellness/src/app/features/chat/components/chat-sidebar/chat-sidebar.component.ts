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
import { MatSidenavModule } from '@angular/material/sidenav';
import { combineLatest, debounceTime, distinctUntilChanged, of, Subject, takeUntil } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';

import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UsuarioService } from '../../../../features/users/services/usuario.service';
import { ChatProvider } from '../../../../shared/models/chat';
import { AnimationContext, AnimationStrategyFactory } from '../../../../shared/services/animation-strategy.service';
import { ChatLayoutService } from '../../../../shared/services/chat-layout.service';
import { ChatRealtimeService } from '../../../../shared/services/chat-realtime.service';
import { ProviderMapperService } from '../../../../shared/services/provider-mapper.service';
import { ContactCardComponent } from '../../../../shared/ui/components/contact/contact-card/contact-card.component';

@Component({
  selector: 'app-chat-sidebar',
  imports: [
    CommonModule,
    MatSidenavModule,
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
  styleUrl: './chat-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ChatSidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chatLayoutService = inject(ChatLayoutService);
  private chatRealtimeService = inject(ChatRealtimeService);
  private providerMapperService = inject(ProviderMapperService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private animationFactory = inject(AnimationStrategyFactory);
  private animationContext = inject(AnimationContext);
  private authService = inject(AuthService);

  // State observables
  layoutState$ = this.chatLayoutService.state$;
  isVisible$ = this.chatLayoutService.state$.pipe(map(state => state.sidebarVisible));
  realtimeState$ = this.chatRealtimeService.state$;

  // Provider data
  allProviders: ChatProvider[] = [];
  filteredProviders: ChatProvider[] = [];
  paginatedProviders: ChatProvider[] = [];
  isLoading = false;
  error: string | null = null;

  // Pagination
  totalProviders = 0;
  pageSize = 10;
  currentPage = 0;

  // Filters
  searchControl = new FormControl('');
  sortControl = new FormControl('name');
  filterControl = new FormControl('all');

  // Selection
  selectedProvider: ChatProvider | null = null;

  // Filter options
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
    this.setupFilters();
    this.loadContacts();
    this.setupRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatRealtimeService.disconnect();
  }

  private setupAnimations(): void {

    const strategy = this.animationFactory.createStrategy('slide');
    this.animationContext.setStrategy(strategy);
  }

  private setupFilters(): void {
    // Combinar todos los controles de filtro para reactividad
    combineLatest([
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.sortControl.valueChanges.pipe(startWith('name')),
      this.filterControl.valueChanges.pipe(startWith('all'))
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([search, sort, filter]) => {
      this.applyFilters(search || '', sort || 'name', filter || 'all');
    });
  }

  private loadContacts(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.error = null;
    console.log('ChatSidebar: Iniciando carga de contactos con RxJS');

    this.authService.getCurrentUserId().pipe(
      // 1. Una vez que tenemos el ID del usuario, cambiamos al siguiente observable.
      switchMap(currentUserId => {
        if (!currentUserId) {
          // Si no hay ID, lanzamos un error para que lo capture el catchError.
          throw new Error('No se pudo obtener el ID del usuario autenticado.');
        }
        // 2. Usamos el ID para obtener la lista de contactos.
        return this.usuarioService.getContacts(currentUserId);
      }),
      // 3. (Opcional pero recomendado) Usamos tap para efectos secundarios como logging.
      tap(contacts => console.log('ChatSidebar: Contactos obtenidos:', contacts?.length || 0)),
      // 4. Manejamos cualquier error que ocurra en la cadena de observables.
      catchError(error => {
        console.error('ChatSidebar: Error loading contacts:', error);
        this.error = 'Error al cargar tus contactos. Intenta nuevamente.';
        // Devolvemos un observable con una lista vacía para que el flujo no se rompa.
        return of([]);
      }),
      // 5. Este bloque se ejecuta siempre, al final, sin importar si hubo éxito o error.
      finalize(() => {
        this.isLoading = false;
        console.log('ChatSidebar: Carga de contactos finalizada');
      })
    ).subscribe(contacts => {
      // 6. El bloque de subscribe ahora solo se encarga de procesar el resultado final.
      if (contacts && contacts.length > 0) {
        const mappedProviders = contacts.map((contact: any) =>
          this.providerMapperService.mapUsuarioToChatProvider(contact)
        );

        this.allProviders = mappedProviders;
        console.log('ChatSidebar: Contactos mapeados:', mappedProviders.length);

        this.applyFilters(
          this.searchControl.value || '',
          this.sortControl.value || 'name',
          this.filterControl.value || 'all'
        );
      } else {
        // Esto se ejecutará si no hay contactos o si hubo un error (gracias a catchError).
        console.warn('ChatSidebar: No se encontraron contactos o hubo un error en la carga.');
        this.allProviders = [];
        this.filteredProviders = [];
        this.paginatedProviders = [];
        this.totalProviders = 0;
      }
    });
  }

  private applyFilters(search: string, sort: string, filter: string): void {
    let filtered = [...this.allProviders];

    // Aplicar búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(provider =>
        provider.nombre.toLowerCase().includes(searchLower) ||
        provider.contactName.toLowerCase().includes(searchLower) ||
        provider.services.some(service =>
          service.name.toLowerCase().includes(searchLower)
        )
      );
    }

    // Aplicar filtro de estado
    switch (filter) {
      case 'online':
        filtered = filtered.filter(provider => provider.isOnline);
        break;
      case 'favorites':
        // TODO: Implementar lógica de favoritos
        // filtered = filtered.filter(provider => provider.isFavorite);
        break;
      case 'recent':
        filtered = filtered.filter(provider =>
          provider.lastSeen &&
          new Date(provider.lastSeen).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );
        break;
    }

    // Aplicar ordenamiento
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

    this.filteredProviders = filtered;
    this.totalProviders = filtered.length;
    this.currentPage = 0; // Reset a primera página
    this.updatePaginatedProviders();
  }

  private updatePaginatedProviders(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProviders = this.filteredProviders.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedProviders();

    // Note: Actualizar estado si es necesario
    // this.chatLayoutService... (implementar si se requiere)
  }

  onProviderSelect(provider: ChatProvider): void {
    this.selectedProvider = provider;
    // TODO: Implementar selección de provider
    // this.chatLayoutService.selectProvider(provider);

    // Opcional: abrir el modal de chat automáticamente
    // this.chatLayoutService.showModal();
  }

  onProviderChat(provider: ChatProvider): void {
    this.selectedProvider = provider;
    // TODO: Implementar chat con provider
    // this.chatLayoutService.selectProvider(provider);
    // this.chatLayoutService.showModal();
  }

  onProviderProfile(provider: ChatProvider): void {
    // Navegar al perfil del proveedor
    console.log('Navigate to provider profile:', provider);
    this.router.navigate(['/proveedor/ver-perfil/', provider.id]);
  }

  onToggleSidebar(): void {
    this.chatLayoutService.toggleSidebar();
  }

  onClearSearch(): void {
    this.searchControl.setValue('');
  }

  onRefresh(): void {
    // Evitar refresh múltiples simultáneos
    if (this.isLoading) {
      console.log('ChatSidebar: Refresh ya en progreso, ignorando solicitud');
      return;
    }

    console.log('ChatSidebar: Iniciando refresh manual de proveedores');

    // Forzar actualización en tiempo real
    this.chatRealtimeService.forceRefresh().subscribe({
      next: () => {
        console.log('ChatSidebar: Actualización en tiempo real completada');
        // Recargar contactos locales
        this.loadContacts();
      },
      error: (err) => {
        console.error('ChatSidebar: Error en refresh en tiempo real:', err);
        // Fallback a carga normal
        this.loadContacts();
      }
    });
  }

  /**
   * Configura actualizaciones en tiempo real
   * Similar a como review-display carga datos automáticamente
   */
  private setupRealtimeUpdates(): void {
    console.log('ChatSidebar: Configurando actualizaciones en tiempo real');

    // Verificar que hay usuario autenticado antes de conectar
    const userId = this.authService.getCurrentUserIdSynchronous();
    if (!userId) {
      console.warn('ChatSidebar: No hay usuario autenticado, saltando setup de tiempo real');
      return;
    }

    // Inicializar ChatLayoutService (lazy initialization)
    this.chatLayoutService.initializeChatData();

    // Conectar al servicio de tiempo real (ahora con usuario autenticado)
    this.chatRealtimeService.connect();

    // Escuchar nuevos contactos (cuando se agregue un contacto)
    this.chatRealtimeService.newContacts$.pipe(
      takeUntil(this.destroy$),
      tap(newContacts => {
        if (newContacts.length > 0) {
          console.log('ChatSidebar: 🔔 Nuevos contactos detectados:', newContacts.length);
          // Recargar contactos automáticamente
          this.loadContacts();
        }
      })
    ).subscribe();

    // Escuchar cambios en conversaciones (puede indicar nuevo contacto activo)
    this.chatRealtimeService.newMessages$.pipe(
      takeUntil(this.destroy$),
      tap(conversations => {
        if (conversations.length > 0) {
          console.log('ChatSidebar: 🔔 Nuevas conversaciones detectadas:', conversations.length);
          // Opcional: Actualizar contactos si hay conversaciones nuevas
          // (puede indicar que alguien te envió mensaje por primera vez)
          this.checkForNewContacts(conversations);
        }
      })
    ).subscribe();
  }

  /**
   * Verifica si hay nuevos contactos basado en conversaciones
   */
  private checkForNewContacts(conversations: any[]): void {
    const currentContactIds = new Set(this.allProviders.map(p => p.id));

    conversations.forEach(conv => {
      const otherParticipant = conv.otherParticipant || conv.participant;
      if (otherParticipant && !currentContactIds.has(otherParticipant.id)) {
        console.log('ChatSidebar: Nuevo contacto detectado de conversación:', otherParticipant);
        // Recargar contactos para incluir el nuevo
        this.loadContacts();
      }
    });
  }

  getAnimationClass(index: number): string {
    // Aplicar animación escalonada
    const delay = index * 50; // 50ms delay entre cada tarjeta
    return `animate-slide-in animation-delay-${delay}`;
  }

  trackByProvider(index: number, provider: ChatProvider): number {
    return provider.id;
  }
}
