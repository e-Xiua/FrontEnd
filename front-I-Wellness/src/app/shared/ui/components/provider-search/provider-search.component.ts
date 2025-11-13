import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { mapProviderDataToUsuario } from '../../../adapters/optimization-result.adapter';
import { EnrichedProviderData } from '../../../models/provider.models';
import { usuarios } from '../../../models/usuarios';
import { RouteBuilderStateService } from '../../../services/route-builder-state.service';

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

  constructor(private readonly routeBuilderStateService: RouteBuilderStateService) {}

  ngOnInit(): void {
    this.loadProviders();
    this.subscribeToProviders();
    this.subscribeToLoadingState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProviders(): void {
    this.routeBuilderStateService.loadProviders();
  }

  private subscribeToProviders(): void {
    this.routeBuilderStateService.providers$
      .pipe(takeUntil(this.destroy$))
      .subscribe((providers: EnrichedProviderData[]) => {
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
