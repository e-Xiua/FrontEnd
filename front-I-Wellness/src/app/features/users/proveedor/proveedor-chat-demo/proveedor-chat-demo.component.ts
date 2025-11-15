import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FloatingChatModalComponent } from "../../../../features/chat/components/floating-chat-modal/floating-chat-modal.component";

@Component({
  selector: 'app-proveedor-chat-demo',
  standalone: true,
  imports: [CommonModule, FloatingChatModalComponent],
  template: `
      <app-floating-chat-modal
        [isVisible]="isModalVisible">
      </app-floating-chat-modal>
  `,
  styles: [`
    /* No wrapper styles needed - modal uses position: fixed */
    :host {
      display: contents; /* Makes the host transparent in the layout */
    }
  `]
})
export class ProveedorChatDemoComponent {
  @Input() isModalVisible: boolean = false;
}
