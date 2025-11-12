import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { OptimizationJob } from '../../models/optimization-job.models';
import { EnrichedProviderData } from '../../models/provider.models';
import { RouteRow } from '../../models/route-builder.models';
import { RouteBuilderStateService } from '../../services/route-builder-state.service';
import { MapPoiComponent } from '../../ui/components/map-poi/map-poi.component';
import { OptimizationStatusTrackerComponent, PoiRouteBuilderComponent, RouteMapDisplayComponent } from '../../ui/components/route-generation';

@Component({
  selector: 'route-generator-full',
  standalone: true,
  imports: [
    CommonModule,
    PoiRouteBuilderComponent,
    OptimizationStatusTrackerComponent,
    RouteMapDisplayComponent,
    MapPoiComponent
  ],
  templateUrl: './route-generator-full.component.html',
  styleUrls: ['./route-generator-full.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteGeneratorFullComponent implements OnInit, OnDestroy {

  // Observables from state service
  providers$: Observable<EnrichedProviderData[]>;
  selectedPois$: Observable<RouteRow[]>;
  activeJobs$: Observable<OptimizationJob[]>;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
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
