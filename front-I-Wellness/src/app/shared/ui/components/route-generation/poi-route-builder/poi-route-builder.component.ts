import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Models
import { EnrichedProviderData } from '../../../../models/provider.models';
import { RouteAverages, RouteRow } from '../../../../models/route-builder.models';

/**
 * POI Route Builder Component (Dumb/Presentational)
 *
 * Dynamic table for building a route by selecting providers and services.
 * Purely presentational - receives data via @Input and emits events via @Output.
 */
@Component({
  selector: 'app-poi-route-builder',
  imports: [CommonModule, FormsModule],
  templateUrl: './poi-route-builder.component.html',
  styleUrl: './poi-route-builder.component.css',
  standalone: true
})
export class PoiRouteBuilderComponent {

  // ========== INPUTS (Data from parent) ==========

  @Input() items: EnrichedProviderData[] = [];
  @Input() rows: RouteRow[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  // ========== OUTPUTS (Events to parent) ==========

  @Output() addRow = new EventEmitter<void>();
  @Output() removeRow = new EventEmitter<string>(); // rowId
  @Output() providerSelected = new EventEmitter<{ rowId: string; providerId: number }>();
  @Output() serviceSelected = new EventEmitter<{ rowId: string; serviceId: number }>();
  @Output() startOptimization = new EventEmitter<'distance' | 'cost' | 'time'>();

  // ========== LOCAL STATE ==========

  selectedOptimizationCriteria: 'distance' | 'cost' | 'time' = 'distance';

  // ========== COMPUTED PROPERTIES ==========

  /**
   * Calculate route averages from selected rows
   * Uses provider averages (backend-calculated from all services)
   */
  get routeAverages(): RouteAverages {
    const validRows = this.rows.filter(row =>
      row.providerId && row.providerData
    );

    if (validRows.length === 0) {
      return {
        avgCost: 0,
        avgDuration: 0,
        totalPOIs: 0
      };
    }

    let totalCost = 0;
    let totalDuration = 0;

    validRows.forEach(row => {
      // Use provider averages (all services considered)
      if (row.providerData) {
        totalCost += row.providerData.averageCost || 0;
        totalDuration += row.providerData.averageVisitDuration || 30;
      }
    });

    return {
      avgCost: totalCost / validRows.length,
      avgDuration: totalDuration / validRows.length,
      totalPOIs: validRows.length
    };
  }

  /**
   * Check if optimization can be started
   * Requires at least 2 providers selected
   */
  get canOptimize(): boolean {
    const validRows = this.rows.filter(row =>
      row.providerId && row.providerData
    );
    return validRows.length >= 2 && !this.isLoading;
  }

  // ========== EVENT HANDLERS ==========

  /**
   * Handle add row button click
   */
  onAddRow(): void {
    this.addRow.emit();
  }

  /**
   * Handle remove row button click
   */
  onRemoveRow(rowId: string): void {
    this.removeRow.emit(rowId);
  }

  /**
   * Handle provider selection change
   */
  onProviderChange(rowId: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const providerId = parseInt(select.value, 10);

    if (!isNaN(providerId)) {
      this.providerSelected.emit({ rowId, providerId });
    }
  }

  /**
   * Handle service selection change
   * NO LONGER USED - Services are displayed, not selected
   */
  onServiceChange(rowId: string, event: Event): void {
    // Deprecated: Services are now displayed automatically when provider is selected
    console.warn('onServiceChange is deprecated - services are now auto-displayed');
  }

  /**
   * Handle optimization button click
   */
  onOptimize(): void {
    if (this.canOptimize) {
      this.startOptimization.emit(this.selectedOptimizationCriteria);
    }
  }

  /**
   * Get services for a specific row
   */
  getServicesForRow(row: RouteRow): any[] {
    if (!row.providerData) {
      return [];
    }
    return row.providerData.services || [];
  }

  /**
   * Check if a row is valid (has provider selected)
   */
  isRowValid(row: RouteRow): boolean {
    return !!(row.providerId && row.providerData);
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByRowId(index: number, row: RouteRow): string {
    return row.id;
  }

  // ========== COST & DURATION HELPERS ==========

  /**
   * Get cost to display for a row
   * Shows provider average cost (calculated from all services)
   */
  getCostForRow(row: RouteRow): number | null {
    if (row.providerData && row.providerId) {
      return row.providerData.averageCost || 0;
    }
    return null;
  }

  /**
   * Get duration to display for a row
   * Shows provider average duration (calculated from all services)
   */
  getDurationForRow(row: RouteRow): number | null {
    if (row.providerData && row.providerId) {
      return row.providerData.averageVisitDuration || 30;
    }
    return null;
  }

  /**
   * Check if cost/duration shown are from provider averages
   * Always true when provider is selected (services are displayed, not used for calculation)
   */
  isShowingAverages(row: RouteRow): boolean {
    return !!row.providerData && !!row.providerId;
  }
}
