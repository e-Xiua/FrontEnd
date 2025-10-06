import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatProvider, Conversation } from '../models/chat';
import { PaginatedResult, PaginationOptions } from './provider-mapper.service';

export type ModalTab = 'contacts' | 'messages';
export type SlideDirection = 'up' | 'down';

export interface ChatLayoutState {
  // Sidebar state
  sidebarVisible: boolean;
  sidebarCollapsed: boolean;

  // Modal state
  modalVisible: boolean;
  modalSlideDirection: SlideDirection;
  activeTab: ModalTab;

  // Data state
  allProviders: ChatProvider[];
  filteredProviders: ChatProvider[];
  activeConversations: Conversation[];

  // Pagination state
  contactsPagination: PaginationOptions;
  messagesPagination: PaginationOptions;

  // UI state
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatLayoutService {
  private stateSubject = new BehaviorSubject<ChatLayoutState>({
    // Sidebar state
    sidebarVisible: true,
    sidebarCollapsed: false,

    // Modal state
    modalVisible: false,
    modalSlideDirection: 'down',
    activeTab: 'contacts',

    // Data state
    allProviders: [],
    filteredProviders: [],
    activeConversations: [],

    // Pagination state
    contactsPagination: {
      page: 1,
      pageSize: 8,
      sortBy: 'nombre',
      sortOrder: 'asc'
    },
    messagesPagination: {
      page: 1,
      pageSize: 10,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    },

    // UI state
    isLoading: false,
    error: null
  });

  public state$ = this.stateSubject.asObservable();

  // Observables específicos
  public sidebarState$ = this.state$.pipe(
    map(state => ({
      visible: state.sidebarVisible,
      collapsed: state.sidebarCollapsed,
      providers: state.filteredProviders,
      pagination: state.contactsPagination,
      isLoading: state.isLoading
    }))
  );

  public modalState$ = this.state$.pipe(
    map(state => ({
      visible: state.modalVisible,
      slideDirection: state.modalSlideDirection,
      activeTab: state.activeTab,
      conversations: state.activeConversations,
      providers: state.filteredProviders,
      contactsPagination: state.contactsPagination,
      messagesPagination: state.messagesPagination,
      isLoading: state.isLoading
    }))
  );

  public paginatedContacts$: Observable<PaginatedResult<ChatProvider>> = combineLatest([
    this.state$,
    this.state$.pipe(map(state => state.contactsPagination))
  ]).pipe(
    map(([state, pagination]) => this.paginateProviders(state.filteredProviders, pagination))
  );

  public paginatedMessages$: Observable<PaginatedResult<Conversation>> = combineLatest([
    this.state$,
    this.state$.pipe(map(state => state.messagesPagination))
  ]).pipe(
    map(([state, pagination]) => this.paginateConversations(state.activeConversations, pagination))
  );

  constructor() {}

  // State getters
  get currentState(): ChatLayoutState {
    return this.stateSubject.value;
  }

  // Sidebar actions
  toggleSidebar(): void {
    this.updateState({
      sidebarVisible: !this.currentState.sidebarVisible
    });
  }

  showSidebar(): void {
    this.updateState({ sidebarVisible: true });
  }

  hideSidebar(): void {
    this.updateState({ sidebarVisible: false });
  }

  toggleSidebarCollapse(): void {
    this.updateState({
      sidebarCollapsed: !this.currentState.sidebarCollapsed
    });
  }

  // Modal actions
  showModal(): void {
    this.updateState({
      modalVisible: true,
      modalSlideDirection: 'up'
    });
  }

  hideModal(): void {
    this.updateState({
      modalVisible: false,
      modalSlideDirection: 'down'
    });
  }

  toggleModal(): void {
    if (this.currentState.modalVisible) {
      this.hideModal();
    } else {
      this.showModal();
    }
  }

  setActiveTab(tab: ModalTab): void {
    this.updateState({ activeTab: tab });
  }

  // Data actions
  setProviders(providers: ChatProvider[]): void {
    this.updateState({
      allProviders: providers,
      filteredProviders: providers
    });
  }

  filterProviders(searchTerm: string): void {
    const filtered = this.currentState.allProviders.filter(provider =>
      provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.updateState({
      filteredProviders: filtered,
      contactsPagination: { ...this.currentState.contactsPagination, page: 1 }
    });
  }

  clearFilter(): void {
    this.updateState({
      filteredProviders: this.currentState.allProviders,
      contactsPagination: { ...this.currentState.contactsPagination, page: 1 }
    });
  }

  setConversations(conversations: Conversation[]): void {
    this.updateState({ activeConversations: conversations });
  }

  // Pagination actions
  updateContactsPagination(updates: Partial<PaginationOptions>): void {
    this.updateState({
      contactsPagination: { ...this.currentState.contactsPagination, ...updates }
    });
  }

  updateMessagesPagination(updates: Partial<PaginationOptions>): void {
    this.updateState({
      messagesPagination: { ...this.currentState.messagesPagination, ...updates }
    });
  }

  goToContactsPage(page: number): void {
    this.updateContactsPagination({ page });
  }

  goToMessagesPage(page: number): void {
    this.updateMessagesPagination({ page });
  }

  // UI state actions
  setLoading(loading: boolean): void {
    this.updateState({ isLoading: loading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  // Layout presets for different breakpoints
  setMobileLayout(): void {
    this.updateState({
      sidebarVisible: false,
      sidebarCollapsed: true,
      contactsPagination: { ...this.currentState.contactsPagination, pageSize: 6 }
    });
  }

  setTabletLayout(): void {
    this.updateState({
      sidebarVisible: true,
      sidebarCollapsed: true,
      contactsPagination: { ...this.currentState.contactsPagination, pageSize: 8 }
    });
  }

  setDesktopLayout(): void {
    this.updateState({
      sidebarVisible: true,
      sidebarCollapsed: false,
      contactsPagination: { ...this.currentState.contactsPagination, pageSize: 10 }
    });
  }

  // Private helper methods
  private updateState(updates: Partial<ChatLayoutState>): void {
    const currentState = this.currentState;
    const newState = { ...currentState, ...updates };
    this.stateSubject.next(newState);
  }

  private paginateProviders(providers: ChatProvider[], options: PaginationOptions): PaginatedResult<ChatProvider> {
    const totalItems = providers.length;
    const totalPages = Math.ceil(totalItems / options.pageSize);
    const startIndex = (options.page - 1) * options.pageSize;
    const endIndex = startIndex + options.pageSize;
    const items = providers.slice(startIndex, endIndex);

    return {
      items,
      totalItems,
      currentPage: options.page,
      totalPages,
      pageSize: options.pageSize,
      hasNext: options.page < totalPages,
      hasPrevious: options.page > 1
    };
  }

  private paginateConversations(conversations: Conversation[], options: PaginationOptions): PaginatedResult<Conversation> {
    const totalItems = conversations.length;
    const totalPages = Math.ceil(totalItems / options.pageSize);
    const startIndex = (options.page - 1) * options.pageSize;
    const endIndex = startIndex + options.pageSize;
    const items = conversations.slice(startIndex, endIndex);

    return {
      items,
      totalItems,
      currentPage: options.page,
      totalPages,
      pageSize: options.pageSize,
      hasNext: options.page < totalPages,
      hasPrevious: options.page > 1
    };
  }

  // Cleanup method
  reset(): void {
    this.stateSubject.next({
      sidebarVisible: true,
      sidebarCollapsed: false,
      modalVisible: false,
      modalSlideDirection: 'down',
      activeTab: 'contacts',
      allProviders: [],
      filteredProviders: [],
      activeConversations: [],
      contactsPagination: {
        page: 1,
        pageSize: 8,
        sortBy: 'nombre',
        sortOrder: 'asc'
      },
      messagesPagination: {
        page: 1,
        pageSize: 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      },
      isLoading: false,
      error: null
    });
  }
}
