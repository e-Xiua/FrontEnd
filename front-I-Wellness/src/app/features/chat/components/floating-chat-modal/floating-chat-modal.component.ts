import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';

import { ContactCardComponent } from '../../../../shared/ui/components/contact/contact-card/contact-card.component';
// // import { ChatInterfaceComponent } from '../chat-interface/chat-interface.component';
import { ChatProvider, Conversation } from '../../../../shared/models/chat';
import { ChatLayoutService, ModalTab } from '../../../../shared/services/chat-layout.service';

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
  ],
  templateUrl: './floating-chat-modal.component.html',
  styleUrl: './floating-chat-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  animations: [
    trigger('slideToggle', [
      state('hidden', style({
        transform: 'translateY(100%)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      state('minimized', style({
        transform: 'translateY(calc(100% - 60px))',
        opacity: 1
      })),
      transition('hidden <=> visible', [
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('visible <=> minimized', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('hidden <=> minimized', [
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
export class FloatingChatModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chatLayoutService = inject(ChatLayoutService);

  // State observables
  layoutState$ = this.chatLayoutService.state$;
  public selectedTabIndex: number = 0;
  paginatedMessages$ = this.chatLayoutService.paginatedMessages$;
  paginatedContacts$ = this.chatLayoutService.paginatedContacts$;
  paginatedProviders$ = this.chatLayoutService.paginatedContacts$; // Alias for consistency
  // Modal state
  modalState: 'hidden' | 'visible' | 'minimized' = 'hidden';
  activeTab: ModalTab = 'contacts';
  isMinimized = false;

  // Selected data
  selectedProvider: ChatProvider | null = null;
  activeConversation: Conversation | null = null;

  // Tab labels
  readonly tabLabels = {
    contacts: 'Contactos',
    messages: 'Mensajes'
  };

  ngOnInit(): void {
    this.subscribeToLayoutState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToLayoutState(): void {
    this.layoutState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.updateModalState(state.modalVisible);
      this.activeTab = state.activeTab;
      this.selectedProvider = state.filteredProviders.find(p => p.id === this.selectedProvider?.id) || null;
    });
  }

  private updateModalState(isVisible: boolean): void {
    if (!isVisible) {
      this.modalState = 'hidden';
      this.isMinimized = false;
    } else if (this.isMinimized) {
      this.modalState = 'minimized';
    } else {
      this.modalState = 'visible';
    }
  }

  onToggleModal(): void {
    if (this.modalState === 'hidden') {
      this.chatLayoutService.showModal();
    } else {
      this.chatLayoutService.hideModal();
    }
  }

  onMinimizeModal(): void {
    if (this.modalState === 'visible') {
      this.isMinimized = true;
      this.modalState = 'minimized';
    } else if (this.modalState === 'minimized') {
      this.isMinimized = false;
      this.modalState = 'visible';
    }
  }

  onCloseModal(): void {
    this.chatLayoutService.hideModal();
  }

  onTabChange(tab: ModalTab): void {
    this.chatLayoutService.setActiveTab(tab);
  }

  onProviderSelect(provider: ChatProvider): void {
    this.selectedProvider = provider;
    // Cambiar automáticamente al tab de mensajes
    this.chatLayoutService.setActiveTab('messages');

    // Crear o recuperar conversación con el provider
    // TODO: Implementar lógica de conversación
  }

  onProviderChat(provider: ChatProvider): void {
    this.onProviderSelect(provider);
  }

  onProviderProfile(provider: ChatProvider): void {
    // TODO: Navegar al perfil del proveedor
    console.log('Navigate to provider profile:', provider);
  }

  onConversationSelect(conversation: Conversation): void {
    this.activeConversation = conversation;
    // TODO: Cargar mensajes de la conversación
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

  trackByConversation(index: number, conversation: Conversation): string {
    return conversation.id;
  }

  getTabIcon(tab: ModalTab): string {
    return tab === 'contacts' ? 'contacts' : 'chat';
  }

  get isVisible(): boolean {
    return this.modalState !== 'hidden';
  }

  get showContent(): boolean {
    return this.modalState === 'visible';
  }

  get hasSelectedProvider(): boolean {
    return this.selectedProvider !== null;
  }

  get modalTitle(): string {
    if (this.activeTab === 'messages' && this.selectedProvider) {
      return `Chat con ${this.selectedProvider.contactName}`;
    }
    return this.tabLabels[this.activeTab];
  }

  tabIndexToModalTab(index: number): ModalTab {
  // Adjust this mapping according to your tab order and ModalTab definition
  return index === 0 ? 'contacts' : 'messages';
}
}
