import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Models
import { EnrichedProviderData } from '../../../../models/provider.models';
import { RouteRow, RouteAverages } from '../../../../models/route-builder.models';

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
   * Now considers both specific service values AND provider averages
   */
  get routeAverages(): RouteAverages {
    // Include rows with either specific service OR just provider selected
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
      // Use specific service if selected, otherwise use provider averages
      if (row.selectedService) {
        totalCost += row.selectedService.precio || 0;
        totalDuration += row.selectedService.tiempoAproximado || 0;
      } else if (row.providerData) {
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
   * Now allows optimization with just providers selected (no service required)
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
   */
  onServiceChange(rowId: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const serviceId = parseInt(select.value, 10);
    
    if (!isNaN(serviceId)) {
      this.serviceSelected.emit({ rowId, serviceId });
    }
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
   * Check if a row is valid (has both provider and service selected)
   */
  isRowValid(row: RouteRow): boolean {
    return !!(row.providerId && row.selectedService);
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
   * - If specific service selected: show service cost
   * - If only provider selected: show provider average cost
   * - Otherwise: return null
   */
  getCostForRow(row: RouteRow): number | null {
    if (row.selectedService) {
      return row.selectedService.precio || 0;
    }
    if (row.providerData && row.providerId) {
      return row.providerData.averageCost || 0;
    }
    return null;
  }

  /**
   * Get duration to display for a row
   * - If specific service selected: show service duration
   * - If only provider selected: show provider average duration
   * - Otherwise: return null
   */
  getDurationForRow(row: RouteRow): number | null {
    if (row.selectedService) {
      return row.selectedService.tiempoAproximado || 0;
    }
    if (row.providerData && row.providerId) {
      return row.providerData.averageVisitDuration || 30;
    }
    return null;
  }

  /**
   * Check if cost/duration shown are from provider averages (not specific service)
   * Used to style differently (e.g., show as estimated)
   */
  isShowingAverages(row: RouteRow): boolean {
    return !row.selectedService && !!row.providerData && !!row.providerId;
  }
}
