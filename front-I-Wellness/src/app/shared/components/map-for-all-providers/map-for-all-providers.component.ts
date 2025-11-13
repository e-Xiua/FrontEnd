import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EnrichedProviderData } from '../../models/provider.models';
import { RouteBuilderStateService } from '../../services/route-builder-state.service';
import { MapPoiComponent } from "../../ui/components/map-poi/map-poi.component";

@Component({
  selector: 'app-map-for-all-providers',
  imports: [MapPoiComponent, CommonModule],
  templateUrl: './map-for-all-providers.component.html',
  styleUrl: './map-for-all-providers.component.css'
})
export class MapForAllProvidersComponent implements OnInit, OnDestroy {

  // Observables from state service
    providers$: Observable<EnrichedProviderData[]>;
    activeProviderId$: Observable<number | null>;

    private destroy$ = new Subject<void>();

    constructor(private readonly state: RouteBuilderStateService) {
        this.providers$ = this.state.providers$;
        this.activeProviderId$ = this.state.activeProviderId$;
      }

  ngOnInit(): void {
    this.state.loadProviders();
  }

    ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryLoad(): void {
    this.state.loadProviders();
  }

    onProviderMapItemSelected(providerId: number | string): void {
    this.state.setActiveProvider(providerId as number);
  }

  onProviderMapNext(): void {
    this.state.selectNextProvider();
  }

  onProviderMapPrevious(): void {
    this.state.selectPreviousProvider();
  }

}
