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
import { combineLatest, debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { UsuarioService } from '../../../../features/users/services/usuario.service';
import { ChatProvider } from '../../../../shared/models/chat';
import { usuarios } from '../../../../shared/models/usuarios';
import { AnimationContext } from '../../../../shared/services/animation-strategy.service';
import { ChatLayoutService } from '../../../../shared/services/chat-layout.service';
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
  private providerMapperService = inject(ProviderMapperService);
  private usuarioService = inject(UsuarioService);
  private animationContext = inject(AnimationContext);

  // State observables
  layoutState$ = this.chatLayoutService.state$;
  isVisible$ = this.chatLayoutService.state$.pipe(map(state => state.sidebarVisible));

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
    this.loadProviders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAnimations(): void {
    // Configurar estrategia de animación para las tarjetas
    // Simplificamos por ahora sin usar factory
    // const strategy = this.animationFactory.createStrategy('slide');
    // this.animationContext.setStrategy(strategy);
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

  private async loadProviders(): Promise<void> {
    // Evitar cargas múltiples simultáneas
    if (this.isLoading) {
      console.log('ChatSidebar: Carga de proveedores ya en progreso');
      return;
    }

    this.isLoading = true;
    this.error = null;

    console.log('ChatSidebar: Iniciando carga de proveedores');

    try {
      // Obtener proveedores del servicio
      const usuarios = await this.usuarioService.obtenerProveedores().toPromise();
      console.log('ChatSidebar: Proveedores obtenidos:', usuarios?.length || 0);

      if (usuarios && usuarios.length > 0) {
        // Mapear usuarios a ChatProvider
        const mappedProviders = usuarios.map((usuario: usuarios) =>
          this.providerMapperService.mapUsuarioToChatProvider(usuario)
        );

        this.allProviders = mappedProviders;
        console.log('ChatSidebar: Proveedores mapeados:', mappedProviders.length);

        // Aplicar filtros iniciales solo si no hay filtros activos
        const currentSearch = this.searchControl.value || '';
        const currentSort = this.sortControl.value || 'name';
        const currentFilter = this.filterControl.value || 'all';

        this.applyFilters(currentSearch, currentSort, currentFilter);

        console.log('ChatSidebar: Filtros aplicados, proveedores filtrados:', this.filteredProviders.length);
      } else {
        console.warn('ChatSidebar: No se encontraron proveedores');
        this.allProviders = [];
        this.filteredProviders = [];
        this.paginatedProviders = [];
        this.totalProviders = 0;
      }
    } catch (error) {
      console.error('ChatSidebar: Error loading providers:', error);
      this.error = 'Error al cargar proveedores. Intenta nuevamente.';
      this.allProviders = [];
      this.filteredProviders = [];
      this.paginatedProviders = [];
      this.totalProviders = 0;
    } finally {
      this.isLoading = false;
      console.log('ChatSidebar: Carga de proveedores finalizada');
    }
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
    // Implementar navegación según la arquitectura existente
    console.log('Navigate to provider profile:', provider);
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
    this.loadProviders();
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
