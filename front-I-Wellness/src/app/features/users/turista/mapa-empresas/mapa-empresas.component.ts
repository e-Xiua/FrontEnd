import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { RouteBuilderStateService } from '../../../../shared/services/route-builder-state.service';
import { OptimizationJob, OptimizationResult } from '../../../../shared/models/optimization-job.models';
import { EnrichedProviderData } from '../../../../shared/models/provider.models';
import { RouteRow } from '../../../../shared/models/route-builder.models';
import {
  PoiRouteBuilderComponent,
  OptimizationStatusTrackerComponent,
  RouteMapDisplayComponent
} from '../../../../shared/ui/components/route-generation';
import { Subject, Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { MapPoiComponent } from '../../../../shared/ui/components/map-poi/map-poi.component';

@Component({
  selector: 'app-mapa-empresas',
  standalone: true,
  imports: [
    CommonModule,
    PoiRouteBuilderComponent,
    OptimizationStatusTrackerComponent,
    RouteMapDisplayComponent,
    MapPoiComponent
  ],
  templateUrl: './mapa-empresas.component.html',
  styleUrls: ['./mapa-empresas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapaEmpresasComponent implements OnInit, OnDestroy {

  // Observables from state service
  providers$: Observable<EnrichedProviderData[]>;
  selectedPois$: Observable<RouteRow[]>;
  activeJobs$: Observable<OptimizationJob[]>;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  activeProviderId$: Observable<number | null>;
  activeOptimizedPoiId$: Observable<number | string | null>;
  selectedJobForDisplay$: Observable<OptimizationJob | null>;

  showCompletedJobs = true;

  private destroy$ = new Subject<void>();

  constructor(private state: RouteBuilderStateService) {
    this.providers$ = this.state.providers$;
    this.selectedPois$ = this.state.selectedPois$;
    this.activeJobs$ = this.state.activeJobs$;
    this.isLoading$ = this.state.isLoading$;
    this.error$ = this.state.error$;
    this.activeProviderId$ = this.state.activeProviderId$;
    this.activeOptimizedPoiId$ = this.state.activeOptimizedPoiId$;
    this.selectedJobForDisplay$ = this.state.selectedJobForDisplay$;
  }

  ngOnInit(): void {
    this.state.loadProviders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // Event Handlers - Delegate to State Service
  // ========================================

  /**
   * Handle add row event from poi-route-builder
   */
  onAddRow(): void {
    this.state.addPoiToRoute();
  }

  /**
   * Handle remove row event from poi-route-builder
   */
  onRemoveRow(rowId: string): void {
    this.state.removePoiFromRoute(rowId);
  }

  /**
   * Handle provider selection event from poi-route-builder
   */
  onProviderSelected(event: { rowId: string; providerId: number }): void {
    this.state.updateRowProvider(event.rowId, event.providerId);
  }

  /**
   * Handle service selection event from poi-route-builder
   */
  onServiceSelected(event: { rowId: string; serviceId: number }): void {
    this.state.updateRowService(event.rowId, event.serviceId);
  }

  /**
   * Handle start optimization event from poi-route-builder
   */
  onStartOptimization(criteria: 'distance' | 'cost' | 'time'): void {
    // Assuming a logged-in user with ID 1 for now
    this.state.startOptimization(1, criteria);
  }

  /**
   * Handle view result event from optimization-status-tracker
   */
  onViewResult(jobId: string): void {
    this.state.selectJob(jobId);
  }

  /**
   * Handle cancel job event from optimization-status-tracker
   */
  onCancelJob(jobId: string): void {
    this.state.cancelJob(jobId);
  }

  /**
   * Handle remove job event from optimization-status-tracker
   */
  onRemoveJob(jobId: string): void {
    this.state.removeJob(jobId);
  }

  /**
   * Handle clear completed jobs event from optimization-status-tracker
   */
  onClearCompleted(): void {
    this.state.clearCompletedJobs();
  }

  /**
   * Handle retry load event for error state
   */
  retryLoad(): void {
    this.state.loadProviders();
  }

  // ==================================================
  // MAP INTERACTION HANDLERS
  // ==================================================

  onProviderMapItemSelected(providerId: number | string): void {
    this.state.setActiveProvider(providerId as number);
  }

  onProviderMapNext(): void {
    this.state.selectNextProvider();
  }

  onProviderMapPrevious(): void {
    this.state.selectPreviousProvider();
  }

  onOptimizedMapItemSelected(poiId: number | string): void {
    this.state.setActiveOptimizedPoi(poiId);
  }

  onOptimizedMapNext(): void {
    this.state.selectNextOptimizedPoi();
  }

  onOptimizedMapPrevious(): void {
    this.state.selectPreviousOptimizedPoi();
  }
}
