import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { ChatProvider, Conversation, Message } from '../../../../../models/chat';
import { AnimationContext } from '../../../../../services/animation-strategy.service';
import { ChatService } from '../../../../../services/chat.service';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { ChatMessageComponent } from '../chat-message/chat-message.component';

@Component({
  selector: 'app-chat-interface',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    ChatMessageComponent,
    ChatInputComponent
  ],
  templateUrl: './chat-interface.component.html',
  styleUrl: './chat-interface.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ChatInterfaceComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd', { static: false }) messagesEnd!: ElementRef;
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  selectedProvider$: Observable<ChatProvider | null>;
  conversation$: Observable<Conversation | undefined>;
  isLoading = false;
  shouldScroll = false;

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private animationContext: AnimationContext,
    private cdr: ChangeDetectorRef
  ) {
    this.selectedProvider$ = this.chatService.getSelectedProvider();

    // Observar cambios en el provider seleccionado para obtener su conversación
    this.conversation$ = combineLatest([
      this.chatService.chatState$,
      this.selectedProvider$
    ]).pipe(
      map(([state, provider]) => {
        if (provider) {
          // Marcar que debe hacer scroll cuando hay nuevos mensajes
          this.shouldScroll = true;
          return state.conversations.find((c: Conversation) => c.providerId === provider.id);
        }
        return undefined;
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    // Suscribirse a cambios en la conversación para scroll automático
    this.conversation$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.shouldScroll = true;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSendMessage(content: string): void {
    this.isLoading = true;
    this.shouldScroll = true;

    this.chatService.sendMessage(content).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        console.log('Message sent:', response);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesEnd?.nativeElement) {
        this.messagesEnd.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }
    } catch (err) {
      console.warn('Could not scroll to bottom:', err);
    }
  }

  getAnimationClass(): string {
    return this.animationContext.applyAnimation();
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}
