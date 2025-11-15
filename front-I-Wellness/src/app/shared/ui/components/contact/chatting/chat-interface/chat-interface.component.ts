import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject, combineLatest, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ChatProvider, Conversation, Message } from '../../../../../models/chat';
import { AnimationContext, AnimationStrategyFactory } from '../../../../../services/animation-strategy.service';
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
    ChatInputComponent,
    MatProgressSpinner
],
  templateUrl: './chat-interface.component.html',
  styleUrl: './chat-interface.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ChatInterfaceComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @ViewChild('messagesEnd', { static: false }) messagesEnd!: ElementRef;
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  selectedProvider$: Observable<ChatProvider | null>;
  conversation$: Observable<Conversation | undefined>;
  currentUserId: number = 0;
  isLoading = false;
  shouldScroll = false;
  showScrollButton = false;

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private animationContext: AnimationContext,
    private animationFactory: AnimationStrategyFactory,
    private cdr: ChangeDetectorRef
  ) {
    this.selectedProvider$ = this.chatService.getSelectedProvider();

    // Obtener el ID del usuario actual
    this.currentUserId = this.chatService.currentState.currentUserId;
    console.log('[ChatInterface] currentUserId:', this.currentUserId);

    // Observar cambios en el provider seleccionado para obtener su conversación
    this.conversation$ = combineLatest([
      this.chatService.chatState$,
      this.selectedProvider$
    ]).pipe(
      map(([state, provider]) => {
        console.log('[ChatInterface] State update:', {
          selectedProviderId: state.selectedProviderId,
          provider: provider,
          conversationsCount: state.conversations.length
        });

        if (provider) {
          // Marcar que debe hacer scroll cuando hay nuevos mensajes
          this.shouldScroll = true;
          const conversation = state.conversations.find((c: Conversation) => c.providerId === provider.id);
          console.log('[ChatInterface] Found conversation:', conversation);
          return conversation;
        }
        return undefined;
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    // Configurar animaciones
    this.setupAnimations();

    // Suscribirse al selectedProvider$ para ver los valores
    this.selectedProvider$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(provider => {
      console.log('[ChatInterface] selectedProvider changed:', provider);
      this.cdr.markForCheck();
    });

    // Suscribirse a cambios en la conversación para scroll automático
    this.conversation$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(conversation => {
      console.log('[ChatInterface] conversation changed:', conversation);
      this.shouldScroll = true;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    // El contenedor de mensajes ya está disponible aquí, es seguro configurar el scroll.
    this.setupScrollDetection();
  }

  private setupAnimations(): void {
    const strategy = this.animationFactory.createStrategy('fade');
    this.animationContext.setStrategy(strategy);
  }

  private setupScrollDetection(): void {
    if (this.messagesContainer?.nativeElement) {
      fromEvent(this.messagesContainer.nativeElement, 'scroll').pipe(
        debounceTime(100),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.checkScrollPosition();
      });
    }
  }

  private checkScrollPosition(): void {
    if (!this.messagesContainer?.nativeElement) return;

    const element = this.messagesContainer.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Mostrar botón si no estamos cerca del final (100px de margen)
    this.showScrollButton = (scrollHeight - scrollTop - clientHeight) > 100;
    this.cdr.markForCheck();
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

    // Marcar para detección de cambios antes de enviar
    this.cdr.markForCheck();

    this.chatService.sendMessage(content).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        console.log('Message sent:', response);
        this.isLoading = false;

        // Forzar scroll después de que el mensaje se haya agregado
        this.shouldScroll = true;
        this.cdr.markForCheck();

        // Usar setTimeout para asegurar que el DOM se actualizó
        setTimeout(() => {
          this.scrollToBottom();
        }, 50);
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

  onScrollToBottom(): void {
    this.shouldScroll = true;
    this.scrollToBottom();
    this.showScrollButton = false;
  }

  getAnimationClass(): string {
    return this.animationContext.applyAnimation();
  }

  trackByMessageId(index: number, message: Message): number {
    return message.id;
  }

  isOwnMessage(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }
}
