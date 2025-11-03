import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { RouteBuilderStateService } from '../../../../shared/services/route-builder-state.service';
import {
  OptimizationJob,
  OptimizationResult
} from '../../../../shared/models/route-generation/optimization-job.models';
import {
  EnrichedProviderData,
  RouteRow
} from '../../../../shared/models/route-generation';
import {
  PoiRouteBuilderComponent,
  OptimizationStatusTrackerComponent,
  RouteMapDisplayComponent
} from '../../../../shared/ui/components/route-generation';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-mapa-empresas',
  templateUrl: './mapa-empresas.component.html',
  styleUrls: ['./mapa-empresas.component.css'],
  imports: [
    CommonModule,
    PoiRouteBuilderComponent,
    OptimizationStatusTrackerComponent,
    RouteMapDisplayComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class MapaEmpresasComponent implements OnInit, OnDestroy {

    // Observable streams from state service
  providers$: Observable<EnrichedProviderData[]>;
  selectedPois$: Observable<RouteRow[]>;
  activeJobs$: Observable<OptimizationJob[]>;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;

  // Local UI state
  selectedJobForDisplay: OptimizationJob | null = null;
  showCompletedJobs: boolean = true;

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private stateService: RouteBuilderStateService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize observables from state service
    this.providers$ = this.stateService.providers$;
    this.selectedPois$ = this.stateService.selectedPois$;
    this.activeJobs$ = this.stateService.activeJobs$;
    this.isLoading$ = this.stateService.isLoading$;
    this.error$ = this.stateService.error$;
  }

  ngOnInit(): void {
    // Load all providers (empty array means load all)
    // TODO: In a real app, you might filter this based on user preferences or location
    this.stateService.loadProviders();

    // Subscribe to active jobs to automatically display completed routes
    this.activeJobs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(jobs => {
        // Auto-select the first completed job for map display
        const completedJob = jobs.find(job => job.status === 'COMPLETED' && job.result);
        if (completedJob && !this.selectedJobForDisplay) {
          this.selectedJobForDisplay = completedJob;
          this.cdr.markForCheck();
        }
      });
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
    this.stateService.addPoiToRoute();
  }

  /**
   * Handle remove row event from poi-route-builder
   */
  onRemoveRow(rowId: string): void {
    this.stateService.removePoiFromRoute(rowId);
  }

  /**
   * Handle provider selection event from poi-route-builder
   */
  onProviderSelected(event: { rowId: string; providerId: number }): void {
    this.stateService.updateRowProvider(event.rowId, event.providerId);
  }

  /**
   * Handle service selection event from poi-route-builder
   */
  onServiceSelected(event: { rowId: string; serviceId: number }): void {
    this.stateService.updateRowService(event.rowId, event.serviceId);
  }

  /**
   * Handle start optimization event from poi-route-builder
   */
  onStartOptimization(optimizeFor: 'distance' | 'cost' | 'time'): void {
    // TODO: Get actual user ID from auth service
    const mockUserId = 1;
    this.stateService.startOptimization(mockUserId, optimizeFor);
  }

  /**
   * Handle view result event from optimization-status-tracker
   */
  onViewResult(job: OptimizationJob): void {
    this.selectedJobForDisplay = job;
    this.cdr.markForCheck();
  }

  /**
   * Handle cancel job event from optimization-status-tracker
   */
  onCancelJob(jobId: string): void {
    this.stateService.cancelJob(jobId);
  }

  /**
   * Handle remove job event from optimization-status-tracker
   */
  onRemoveJob(jobId: string): void {
    this.stateService.removeJob(jobId);
    
    // If the removed job was being displayed, clear the display
    if (this.selectedJobForDisplay?.jobId === jobId) {
      this.selectedJobForDisplay = null;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle clear completed jobs event from optimization-status-tracker
   */
  onClearCompleted(): void {
    this.stateService.clearCompletedJobs();
    
    // Clear the display if showing a completed job
    if (this.selectedJobForDisplay?.status === 'COMPLETED') {
      this.selectedJobForDisplay = null;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle retry load event for error state
   */
  retryLoad(): void {
    this.stateService.loadProviders();
  }
}
