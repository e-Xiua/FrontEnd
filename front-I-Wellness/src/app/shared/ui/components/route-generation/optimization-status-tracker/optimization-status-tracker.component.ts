import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Models
import { OptimizationJob } from '../../../../models/route-generation';

/**
 * Optimization Status Tracker Component (Dumb/Presentational)
 * 
 * Displays a list of active and completed optimization jobs with their progress.
 * Shows status, progress bars, and provides actions (view result, cancel, remove).
 */
@Component({
  selector: 'app-optimization-status-tracker',
  imports: [CommonModule],
  templateUrl: './optimization-status-tracker.component.html',
  styleUrl: './optimization-status-tracker.component.css'
})
export class OptimizationStatusTrackerComponent {

  // ========== INPUTS (Data from parent) ==========
  
  @Input() jobs: OptimizationJob[] = [];
  @Input() showCompleted: boolean = true;

  // ========== OUTPUTS (Events to parent) ==========
  
  @Output() viewResult = new EventEmitter<OptimizationJob>(); // Full job object
  @Output() cancelJob = new EventEmitter<string>(); // jobId
  @Output() removeJob = new EventEmitter<string>(); // jobId
  @Output() clearCompleted = new EventEmitter<void>();

  // ========== COMPUTED PROPERTIES ==========

  /**
   * Get jobs that are actively processing
   */
  get activeJobs(): OptimizationJob[] {
    return this.jobs.filter(job => 
      job.status === 'PENDING' || job.status === 'PROCESSING'
    );
  }

  /**
   * Get jobs that have completed
   */
  get completedJobs(): OptimizationJob[] {
    return this.jobs.filter(job => 
      job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED'
    );
  }

  /**
   * Check if there are any active jobs
   */
  get hasActiveJobs(): boolean {
    return this.activeJobs.length > 0;
  }

  /**
   * Check if there are any completed jobs
   */
  get hasCompletedJobs(): boolean {
    return this.completedJobs.length > 0;
  }

  // ========== EVENT HANDLERS ==========

  /**
   * Handle view result button click
   */
  onViewResult(job: OptimizationJob): void {
    this.viewResult.emit(job);
  }

  /**
   * Handle cancel job button click
   */
  onCancelJob(jobId: string): void {
    this.cancelJob.emit(jobId);
  }

  /**
   * Handle remove job button click
   */
  onRemoveJob(jobId: string): void {
    this.removeJob.emit(jobId);
  }

  /**
   * Handle clear all completed button click
   */
  onClearCompleted(): void {
    this.clearCompleted.emit();
  }

  // ========== HELPER METHODS ==========

  /**
   * Get status badge class based on job status
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'PROCESSING':
        return 'status-processing';
      case 'COMPLETED':
        return 'status-completed';
      case 'FAILED':
        return 'status-failed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  /**
   * Get status icon based on job status
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'fa-clock';
      case 'PROCESSING':
        return 'fa-spinner fa-spin';
      case 'COMPLETED':
        return 'fa-check-circle';
      case 'FAILED':
        return 'fa-times-circle';
      case 'CANCELLED':
        return 'fa-ban';
      default:
        return 'fa-question-circle';
    }
  }

  /**
   * Get progress bar color based on job status
   */
  getProgressColor(status: string): string {
    switch (status) {
      case 'PROCESSING':
        return '#3498db';
      case 'COMPLETED':
        return '#27ae60';
      case 'FAILED':
        return '#e74c3c';
      case 'CANCELLED':
        return '#95a5a6';
      default:
        return '#f39c12';
    }
  }

  /**
   * Format elapsed time for display
   */
  getElapsedTime(job: OptimizationJob): string {
    if (!job.submittedAt) {
      return 'Unknown';
    }

    const end = job.completedAt || new Date();
    const start = new Date(job.submittedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffMins > 0) {
      const secs = diffSecs % 60;
      return `${diffMins}m ${secs}s`;
    }
    
    return `${diffSecs}s`;
  }

  /**
   * Format estimated completion time
   */
  getEstimatedCompletion(job: OptimizationJob): string {
    if (!job.estimatedCompletionTime) {
      return 'Calculating...';
    }

    const now = new Date();
    const eta = new Date(job.estimatedCompletionTime);
    const diffMs = eta.getTime() - now.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs <= 0) {
      return 'Soon...';
    }

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins > 0) {
      return `~${diffMins}m remaining`;
    }

    return `~${diffSecs}s remaining`;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByJobId(index: number, job: OptimizationJob): string {
    return job.jobId;
  }
}
