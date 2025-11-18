import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LayoutAdapterService } from '../../services/layout-adapter.service';

/**
 * Componente Adaptador de Layout
 * Aplica automáticamente estilos dinámicos basados en el estado del chat
 */
@Component({
  selector: 'app-layout-adapter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="adaptive-layout-container" [ngStyle]="containerStyles">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .adaptive-layout-container {
      min-height: 100vh;
      width: 100%;
      position: relative;
    }

    /* Asegurar que el contenido sea totalmente adaptable */
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class LayoutAdapterComponent implements OnInit, OnDestroy {
  @Input() adaptForSidebar = true;
  @Input() adaptForModal = true;
  @Input() adaptForHeader = true;

  containerStyles: any = {};
  private destroy$ = new Subject<void>();

  constructor(private layoutAdapter: LayoutAdapterService) {}

  ngOnInit(): void {
    // Suscribirse a cambios en el estilo del contenido principal
    this.layoutAdapter.mainContentStyle$
      .pipe(takeUntil(this.destroy$))
      .subscribe(styles => {
        this.containerStyles = {
          ...this.containerStyles,
          ...(this.adaptForSidebar ? {
            marginLeft: styles.marginLeft,
            transition: styles.transition
          } : {}),
          ...(this.adaptForHeader ? {
            paddingTop: styles.paddingTop
          } : {})
        };
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
