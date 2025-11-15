import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FloatingChatModalComponent } from '../../../chat/components/floating-chat-modal/floating-chat-modal.component';

@Component({
  selector: 'app-turista-chat-demo',
  standalone: true,
  imports: [CommonModule, FloatingChatModalComponent],
  template: `
    <app-floating-chat-modal
      [isVisible]="isModalVisible"
      class="chat-modal-wrapper"
    ></app-floating-chat-modal>
  `,
  styles: [
    `
      .chat-modal-wrapper {
        position: relative;
        z-index: 1100;
      }
    `,
  ],
})
export class TuristaChatDemoComponent {
  @Input() isModalVisible: boolean = false;
}
