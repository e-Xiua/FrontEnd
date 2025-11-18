import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { mapProviderDataToUsuario } from '../../../adapters/optimization-result.adapter';
import { EnrichedProviderData, Service } from '../../../models/provider.models';
import { usuarios } from '../../../models/usuarios';
import { RouteBuilderStateService } from '../../../services/route-builder-state.service';
import { UsuarioService } from '../../../../features/users/services/usuario.service';

@Component({
  selector: 'app-provider-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-search.component.html',
  styleUrl: './provider-search.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ width: '0', opacity: 0 }),
        animate('300ms ease-out', style({ width: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ width: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class ProviderSearchComponent implements OnInit, OnDestroy {
  @Output() providerSelected = new EventEmitter<usuarios>();

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  searchQuery = '';
  allProviders: EnrichedProviderData[] = [];
  filteredProviders: usuarios[] = [];
  isLoading = false;
  showResults = false;
  isSearchVisible = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly routeBuilderStateService: RouteBuilderStateService,
    private readonly usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    console.log('🔧 ProviderSearchComponent inicializado');
    this.loadProviders();
    this.subscribeToProviders();
    this.subscribeToLoadingState();
    
    // Fallback: Si después de 3 segundos no hay proveedores, cargar directamente
    setTimeout(() => {
      if (this.allProviders.length === 0) {
        console.log('⚠️ No hay proveedores del RouteBuilderState, intentando fallback...');
        this.loadProvidersFallback();
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProviders(): void {
    console.log('📥 Cargando proveedores...');
    this.routeBuilderStateService.loadProviders();
  }

  private subscribeToProviders(): void {
    this.routeBuilderStateService.providers$
      .pipe(takeUntil(this.destroy$))
      .subscribe((providers: EnrichedProviderData[]) => {
        console.log('📦 Proveedores recibidos:', providers.length);
        if (providers.length > 0) {
          console.log('📝 Primer proveedor:', providers[0]);
        }
        this.allProviders = providers;
        this.filterProviders();
      });
  }

  private subscribeToLoadingState(): void {
    this.routeBuilderStateService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => {
        this.isLoading = loading;
      });
  }

  /**
   * Método de fallback para cargar proveedores directamente desde UsuarioService
   * Se usa cuando RouteBuilderStateService no tiene datos disponibles
   */
  private loadProvidersFallback(): void {
    console.log('📥 Cargando proveedores desde UsuarioService (fallback)...');
    this.isLoading = true;
    
    this.usuarioService.obtenerProveedores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (proveedores: usuarios[]) => {
          console.log('✅ Proveedores cargados (fallback):', proveedores.length);
          
          // Convertir usuarios a EnrichedProviderData básico
          const enrichedData: EnrichedProviderData[] = proveedores
            .filter(p => p.id) // Filtrar solo proveedores con ID válido
            .map(proveedor => ({
              provider: {
                id: proveedor.id,
                nombre_empresa: proveedor.nombre || 'Sin nombre',
                foto: proveedor.foto,
                correo: proveedor.correo,
                coordenadaX: 0, // No tenemos coordenadas en este fallback
                coordenadaY: 0,
              },
              services: [] as Service[],
              averageCost: 0,
              averageVisitDuration: 0,
              categories: proveedor.proveedorInfo?.categories || []
            }));
          
          this.allProviders = enrichedData;
          console.log('📝 Datos enriquecidos (fallback):', enrichedData.length);
          if (enrichedData.length > 0) {
            console.log('📝 Primer proveedor (fallback):', enrichedData[0]);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar proveedores (fallback):', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Devuelve la URL de avatar para un proveedor (usa DiceBear como fallback generado)
   */
  getAvatarUrl(provider: usuarios): string {
    try {
      const name = (provider?.nombre || 'P').toString();
      return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    } catch (e) {
      return '/assets/default-avatar.svg';
    }
  }

  onSearchChange(): void {
    this.filterProviders();
    this.showResults = this.searchQuery.length > 0;
  }

  /** Toggle visibility of the search input/results (used by header button) */
  toggleSearch(): void {
    this.isSearchVisible = !this.isSearchVisible;

    // If we are opening the search, focus the input. If closing, clear results.
    if (this.isSearchVisible) {
      // wait for the input to be rendered
      setTimeout(() => {
        try {
          this.searchInputRef?.nativeElement.focus();
        } catch (e) {
          // ignore focus errors
        }
      }, 0);
    } else {
      this.clearSearch();
    }
  }

  private filterProviders(): void {
    if (!this.searchQuery.trim()) {
      this.filteredProviders = [];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    const matchingEnrichedProviders = this.allProviders.filter((enriched: EnrichedProviderData) => {
      const companyName = enriched.provider.nombre_empresa?.toLowerCase() || '';
      const categories = enriched.categories?.join(' ').toLowerCase() || '';

      return companyName.includes(query) || categories.includes(query);
    });

    this.filteredProviders = matchingEnrichedProviders.map(mapProviderDataToUsuario);
    
    console.log('🔎 Búsqueda:', query);
    console.log('📊 Proveedores encontrados:', this.filteredProviders.length);
    if (this.filteredProviders.length > 0) {
      console.log('📝 Primer resultado:', this.filteredProviders[0]);
      console.log('  - Nombre:', this.filteredProviders[0].nombre);
      console.log('  - Email:', this.filteredProviders[0].correo);
      console.log('  - Foto:', this.filteredProviders[0].foto);
      console.log('  - Categorías:', this.filteredProviders[0].proveedorInfo?.categories);
    }
  }

  selectProvider(provider: usuarios): void {
    console.log('🔍 Proveedor seleccionado:', provider);
    console.log('📋 Categorías:', provider.proveedorInfo?.categories);
    console.log('📧 Email:', provider.correo);
    
    // Emit the provider selection event for parent components (e.g., navigation)
    this.providerSelected.emit(provider);
    
    // Keep the provider name visible in the search input
    this.searchQuery = provider.nombre || '';
    
    // Hide the results dropdown
    this.showResults = false;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredProviders = [];
    this.showResults = false;
  }

  /**
   * Helper method to encode URI components for use in templates
   */
  encodeURIComponent(str: string): string {
    return encodeURIComponent(str);
  }

  onInputFocus(): void {
    if (this.searchQuery.length > 0) {
      this.showResults = true;
    }
  }

  onInputBlur(): void {
    // Delay hiding results to allow click events on cards
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }
}
