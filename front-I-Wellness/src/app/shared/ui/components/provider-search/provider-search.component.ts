import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  styleUrl: './provider-search.component.css'
})
export class ProviderSearchComponent implements OnInit, OnDestroy {
  @Output() providerSelected = new EventEmitter<usuarios>();

  searchQuery = '';
  allProviders: EnrichedProviderData[] = [];
  filteredProviders: usuarios[] = [];
  isLoading = false;
  showResults = false;

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
  }

  selectProvider(provider: usuarios): void {
    this.providerSelected.emit(provider);
    this.searchQuery = provider.nombre || '';
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
