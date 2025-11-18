import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';

import { ChatProvider, ChatState, Conversation } from '../../../../shared/models/chat';
import { AnimationContext, AnimationStrategyFactory } from '../../../../shared/services/animation-strategy.service';
import { ChatLayoutService, ModalTab } from '../../../../shared/services/chat-layout.service';
import { ChatRealtimeService } from '../../../../shared/services/chat-realtime.service';
import { ChatService } from '../../../../shared/services/chat.service';
import { ChatInterfaceComponent } from "../../../../shared/ui/components/contact/chatting/chat-interface/chat-interface.component";
import { ContactCardComponent } from '../../../../shared/ui/components/contact/contact-card/contact-card.component';

@Component({
  selector: 'app-floating-chat-modal',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ContactCardComponent
    // ChatInterfaceComponent
    ,
    ChatInterfaceComponent
],
  templateUrl: './floating-chat-modal.component.html',
  styleUrl: './floating-chat-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  animations: [
    trigger('slideToggle', [
      state('hidden', style({
        transform: 'translateY(100%)',
        opacity: 0,
        visibility: 'hidden'
      })),
      state('visible', style({
        transform: 'translateY(0)',
        opacity: 1,
        visibility: 'visible'
      })),
      state('minimized', style({
        transform: 'translateY(calc(100% - 60px))',
        opacity: 1,
        visibility: 'visible'
      })),
      transition('* <=> *', [
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ])
    ]),
    trigger('tabSlide', [
      transition(':enter', [
        style({ transform: 'translateX(20px)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class FloatingChatModalComponent implements OnInit, OnDestroy, OnChanges {
  private destroy$ = new Subject<void>();
  private chatLayoutService = inject(ChatLayoutService);
  private chatService = inject(ChatService);
  private chatRealtimeService = inject(ChatRealtimeService);
  private animationFactory = inject(AnimationStrategyFactory);
  private animationContext = inject(AnimationContext);

  // Inputs & State
  @Input() isVisible: boolean = false;
  modalState: 'hidden' | 'visible' | 'minimized' = 'hidden';
  isMinimized = false;

  // State observables
  layoutState$ = this.chatLayoutService.state$;
  chatState$ = this.chatService.chatState$;
  realtimeState$ = this.chatRealtimeService.state$;
  public selectedTabIndex: number = 0;
  paginatedMessages$ = this.chatLayoutService.paginatedMessages$;
  paginatedContacts$ = this.chatLayoutService.paginatedContacts$;
  paginatedProviders$ = this.chatLayoutService.paginatedContacts$; // Alias for consistency
  // Modal state
  activeTab: ModalTab = 'contacts';

  // Selected data
  selectedProvider: ChatProvider | null = null;
  activeConversation: Conversation | null = null;
  selectedProviderId: number | null = null;

  // Tab labels
  readonly tabLabels = {
    conversations: 'Conversaciones',
    chat: 'Chat Activo'
  };

  ngOnInit(): void {
    this.setupAnimations();
    this.subscribeToLayoutState();
    this.subscribeToChatState();
    this.setupRealtimeUpdates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible']) {
      this.updateModalState(changes['isVisible'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatRealtimeService.disconnect();
  }

  private setupAnimations(): void {
    // Usar estrategia de slide para los elementos del modal
    const strategy = this.animationFactory.createStrategy('slide');
    this.animationContext.setStrategy(strategy);
  }

  private subscribeToLayoutState(): void {
    this.layoutState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.activeTab = state.activeTab;

      // Actualizar selectedTabIndex cuando cambia el tab
      this.selectedTabIndex = state.activeTab === 'conversations' ? 0 : 1;

      this.selectedProvider = state.filteredProviders.find(p => p.id === this.selectedProvider?.id) || null;
    });
  }

  private subscribeToChatState(): void {
    this.chatState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((state: ChatState) => {
      // Sincronizar con el provider seleccionado en ChatService
      this.selectedProviderId = state.selectedProviderId;

      // Si hay un provider seleccionado, buscar la conversación activa
      if (this.selectedProviderId) {
        this.activeConversation = state.conversations.find(
          (c: Conversation) => c.providerId === this.selectedProviderId
        ) || null;
      } else {
        this.activeConversation = null;
      }
    });
  }

  private updateModalState(isVisible: boolean): void {
    if (!isVisible) {
      this.modalState = 'hidden';
      this.isMinimized = false; // Reset minimized state when hidden
    } else {
      // Si es visible, el estado depende de si está minimizado o no
      this.modalState = this.isMinimized ? 'minimized' : 'visible';
    }
  }

  onMinimizeModal(): void {
    this.isMinimized = !this.isMinimized;
    this.updateModalState(this.isVisible);
  }

  onCloseModal(): void {
    this.chatLayoutService.hideModal();
  }

  onTabChange(tab: ModalTab): void {
    this.chatLayoutService.setActiveTab(tab);
  }

  onProviderSelect(provider: ChatProvider): void {
    console.log('FloatingChatModal: Seleccionando proveedor', provider);
    this.selectedProvider = provider;

    // Usar el método integrado para seleccionar proveedor
    this.chatLayoutService.selectProvider(provider.id);

    // El ChatLayoutService ya cambió automáticamente al tab de mensajes
    console.log('FloatingChatModal: Proveedor seleccionado y conversación iniciada');
  }

  onProviderChat(provider: ChatProvider): void {
    this.onProviderSelect(provider);

  }

  onProviderProfile(provider: ChatProvider): void {
    // TODO: Navegar al perfil del proveedor
    console.log('Navigate to provider profile:', provider);
  }

  onBackToConversations(): void {
    this.chatService.selectProvider(null);
    this.chatLayoutService.setActiveTab('conversations');
  }

  onConversationSelect(conversation: Conversation): void {
    console.log('FloatingChatModal: Seleccionando conversación', conversation);

    // Verificar que existe providerId
    if (!conversation.providerId) {
      console.warn('FloatingChatModal: Conversación sin providerId', conversation);
      return;
    }

    // Usar ChatService para seleccionar el provider (esto carga todos los mensajes)
    this.chatService.selectProvider(conversation.providerId);

    // Actualizar estado local
    this.activeConversation = conversation;
    this.selectedProviderId = conversation.providerId;

    // El provider se actualizará automáticamente a través de la suscripción a chatState$
    console.log('FloatingChatModal: Conversación seleccionada, cargando mensajes...');
    this.chatLayoutService.setActiveTab('chat');
  }

  // Método para enviar mensajes
  onSendMessage(content: string): void {
    if (!this.selectedProvider) {
      console.warn('FloatingChatModal: No hay proveedor seleccionado para enviar mensaje');
      return;
    }

    console.log('FloatingChatModal: Enviando mensaje:', content);
    this.chatLayoutService.sendMessage(content).subscribe({
      next: (response) => {
        console.log('FloatingChatModal: Mensaje enviado exitosamente', response);
      },
      error: (error) => {
        console.error('FloatingChatModal: Error enviando mensaje', error);
      }
    });
  }

  onContactsPageChange(event: PageEvent): void {
    this.chatLayoutService.updateContactsPagination({
      page: event.pageIndex + 1, // Convert from 0-based to 1-based
      pageSize: event.pageSize
    });
  }

  onMessagesPageChange(event: PageEvent): void {
    this.chatLayoutService.updateMessagesPagination({
      page: event.pageIndex + 1, // Convert from 0-based to 1-based
      pageSize: event.pageSize
    });
  }

  trackByProvider(index: number, provider: ChatProvider): number {
    return provider.id;
  }

  trackByConversation(index: number, conversation: Conversation): number {
    return conversation.id;
  }

  getTabIcon(tab: ModalTab): string {
    return tab === 'contacts' ? 'contacts' : 'chat';
  }

  get showContent(): boolean {
    return this.modalState === 'visible';
  }

  get hasSelectedProvider(): boolean {
    // Verificar si hay un provider seleccionado en el ChatService
    return this.selectedProviderId !== null && this.selectedProviderId !== undefined;
  }

  get modalTitle(): string {
    if (this.activeTab === 'chat' && this.activeConversation) {
      // Mostrar nombre del participante de la conversación
      const participantName = this.activeConversation.participant?.nombre ||
                             this.activeConversation.participant2?.nombre ||
                             `Usuario #${this.selectedProviderId}`;
      return `Chat con ${participantName}`;
    }
    return this.tabLabels[this.activeTab as keyof typeof this.tabLabels];
  }

  tabIndexToModalTab(index: number): ModalTab {
  // Adjust this mapping according to your tab order and ModalTab definition
  return index === 0 ? 'conversations' : 'chat';
}

  getAnimationClass(): string {
    return this.animationContext.applyAnimation();
  }

  /**
   * Configura actualizaciones en tiempo real para mensajes
   * Similar al patrón de smart components de reviews
   */
  private setupRealtimeUpdates(): void {
    console.log('FloatingChatModal: Configurando actualizaciones en tiempo real');

    // Ya conectado por el ChatSidebarComponent, solo escuchar eventos

    // Escuchar nuevos mensajes
    this.chatRealtimeService.newMessages$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(conversations => {
      if (conversations.length > 0) {
        console.log('FloatingChatModal: 🔔 Nuevos mensajes detectados:', conversations.length);

        // Actualizar conversaciones automáticamente
        this.chatService.loadInitialConversations().subscribe({
          next: () => {
            console.log('FloatingChatModal: Conversaciones actualizadas automáticamente');

            // Si el modal está en el tab de mensajes, mostrar notificación visual
            if (this.activeTab === 'conversations') {
              this.showNewMessageIndicator();
            }
          },
          error: (err) => console.error('FloatingChatModal: Error actualizando conversaciones:', err)
        });
      }
    });

    // Escuchar estado de conexión
    this.chatRealtimeService.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      if (state.error) {
        console.warn('FloatingChatModal: Error en tiempo real:', state.error);
      }

      if (!state.isConnected && state.error) {
        // Mostrar indicador de desconexión si es necesario
        console.error('FloatingChatModal: Desconectado del servicio en tiempo real');
      }
    });
  }

  /**
   * Muestra un indicador visual de nuevo mensaje
   * (puede ser un badge, notificación, etc.)
   */
  private showNewMessageIndicator(): void {

    console.log('FloatingChatModal: 💬 Nuevos mensajes disponibles');


  }
}
