import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatProvider, Message } from '../../../../../models/chat';

@Component({
  selector: 'app-chat-message',
  imports: [CommonModule, DatePipe, MatIconModule],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ChatMessageComponent {
  @Input({ required: true }) message!: Message;
  @Input() provider: ChatProvider | null = null;
  @Input() isOwn: boolean = false;
  @Input() animationClass: string = '';

  get avatarUrl(): string {
    if (this.isOwn) {
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
    }
    return this.provider?.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default';
  }

  get displayName(): string {
    if (this.isOwn) {
      return 'Tú';
    }
    return this.provider?.contactName || 'Provider';
  }

  get statusIcon(): string {
    switch (this.message.status) {
      case 'sending':
        return 'schedule';
      case 'sent':
        return 'done';
      case 'delivered':
        return 'done_all';
      case 'read':
        return 'done_all';
      default:
        return '';
    }
  }

  get statusClass(): string {
    return this.message.status === 'read' ? 'status-read' : 'status-default';
  }
}
