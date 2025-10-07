import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type TabOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'app-floating-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="floating-tab"
      [class.horizontal]="orientation === 'horizontal'"
      [class.vertical]="orientation === 'vertical'"
      [class.visible]="visible"
      [class.right-position]="position === 'right'"
      [class.left-position]="position === 'left'"
      [class.top-position]="position === 'top'"
      [class.bottom-position]="position === 'bottom'"
      (click)="onTabClick()"
      [attr.aria-label]="ariaLabel"
      [attr.title]="label">

      <span class="tab-content" [class.rotated]="orientation === 'vertical'">
        <ng-container *ngIf="iconClass; else labelOnly">
          <i [class]="iconClass" class="tab-icon"></i>
          <span class="tab-text">{{ label }}</span>
        </ng-container>
        <ng-template #labelOnly>
          <span class="tab-text">{{ label }}</span>
        </ng-template>
      </span>
    </button>
  `,
  styles: [`
    :host { position: relative; }

    .floating-tab {
      position: fixed;
      z-index: 9999;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      visibility: hidden;
      transform: translateX(-100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #333333;
      min-width: 40px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    .floating-tab.visible {
      opacity: 1;
      visibility: visible;
      transform: translateX(0);
    }

    .floating-tab:hover {
      background: #f5f5f5;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      transform: translateX(0) scale(1.05);
    }

    .floating-tab:active {
      transform: translateX(0) scale(0.98);
    }

    /* Orientación horizontal */
    .floating-tab.horizontal {
      padding: 8px 16px;
      min-width: 100px;
    }

    .floating-tab.horizontal.top-position {
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
    }

    .floating-tab.horizontal.top-position.visible {
      transform: translateX(-50%) translateY(0);
    }

    .floating-tab.horizontal.bottom-position {
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
    }

    .floating-tab.horizontal.bottom-position.visible {
      transform: translateX(-50%) translateY(0);
    }

    /* La clase previa .floating-tab.chat-tab-bottom-right se reemplaza por estilos en :host */

    /* Orientación vertical */
    .floating-tab.vertical {
      padding: 16px 8px;
      min-height: 100px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }

    .floating-tab.vertical.left-position {
      top: 50%;
      left: 20px;
      transform: translateY(-50%) translateX(-100%);
    }

    .floating-tab.vertical.left-position.visible {
      transform: translateY(-50%) translateX(0);
    }

    .floating-tab.vertical.right-position {
      top: 50%;
      right: 20px;
      transform: translateY(-50%) translateX(100%);
    }

    .floating-tab.vertical.right-position.visible {
      transform: translateY(-50%) translateX(0);
    }

    /* Contenido del tab */
    .tab-content {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .tab-content.rotated {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      flex-direction: column;
      gap: 4px;
    }

    .tab-icon {
      font-size: 16px;
      line-height: 1;
    }

    .tab-text {
      font-weight: 500;
      line-height: 1.2;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .floating-tab {
        min-width: 36px;
        min-height: 36px;
        font-size: 12px;
      }

      .floating-tab.horizontal {
        padding: 6px 12px;
        min-width: 80px;
      }

      .floating-tab.vertical {
        padding: 12px 6px;
        min-height: 80px;
      }

      .tab-icon {
        font-size: 14px;
      }
    }

    /* Animation enhancements */
    @media (prefers-reduced-motion: no-preference) {
      .floating-tab {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .floating-tab:hover {
        transition: all 0.2s ease-out;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .floating-tab {
        transition: none;
      }
    }
  `]
})
export class FloatingTabComponent {
  @Input() label: string = '';
  @Input() iconClass?: string;
  @Input() orientation: TabOrientation = 'horizontal';
  @Input() position: 'left' | 'right' | 'top' | 'bottom' = 'left';
  @Input() visible: boolean = false;
  @Input() customAriaLabel?: string;

  @Output() tabClick = new EventEmitter<void>();

  get ariaLabel(): string {
    return this.customAriaLabel || `Mostrar ${this.label}`;
  }

  onTabClick(): void {
    this.tabClick.emit();
  }
}
