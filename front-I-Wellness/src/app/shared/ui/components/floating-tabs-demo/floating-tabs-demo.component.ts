import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FloatingChatModalComponent } from "../../../../features/chat/components/floating-chat-modal/floating-chat-modal.component";

@Component({
  selector: 'app-floating-tabs-demo',
  standalone: true,
  imports: [CommonModule, FloatingChatModalComponent],
  template: `
      <app-floating-chat-modal
    class="chat-modal-wrapper">
  </app-floating-chat-modal>
  `,
  styles: [`
    .chat-modal-wrapper {
  position: relative;
  z-index: 1100;
}
  `]
})
export class FloatingTabsDemoComponent {

}
