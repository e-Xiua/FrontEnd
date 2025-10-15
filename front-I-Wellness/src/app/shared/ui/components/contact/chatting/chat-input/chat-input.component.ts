import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-chat-input',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ChatInputComponent {
  @Input() disabled: boolean = false;
  @Output() sendMessage = new EventEmitter<string>();

  message: string = '';

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.message.trim() && !this.disabled) {
      this.sendMessage.emit(this.message.trim());
      this.message = '';
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit(event);
    }
  }

  onEmojiClick(): void {
    // TODO: Implementar picker de emojis
    console.log('Emoji picker clicked');
  }

  onAttachClick(): void {
    // TODO: Implementar adjuntar archivo
    console.log('Attach file clicked');
  }
}
