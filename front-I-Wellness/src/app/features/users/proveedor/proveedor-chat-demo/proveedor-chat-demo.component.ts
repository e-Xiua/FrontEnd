import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FloatingChatModalComponent } from "../../../../features/chat/components/floating-chat-modal/floating-chat-modal.component";
import { ChatLayoutService } from '../../../../shared/services/chat-layout.service';

@Component({
  selector: 'app-proveedor-chat-demo',
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
export class ProveedorChatDemoComponent implements OnInit {
  private chatLayoutService = inject(ChatLayoutService);

  ngOnInit(): void {
    this.chatLayoutService.showModal();
  }
}
