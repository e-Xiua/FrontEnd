import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth/auth.service';
import { UsuarioService } from '../../features/users/services/usuario.service';
import {
    ChatProvider,
    ChatState,
    Conversation,
    ConversationSummary,
    Message,
    SendMessageResponse,
    UsuarioDTO
} from '../models/chat';
import { ConversationApiService } from './conversation-api.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatStateSubject = new BehaviorSubject<ChatState>({
    providers: [],
    conversations: [],
    selectedProviderId: null,
    currentUserId: 1, // Will be updated from auth service
    isLoading: false,
    error: null
  });

  public chatState$ = this.chatStateSubject.asObservable();

  constructor(
    private conversationApi: ConversationApiService,
    private authService: AuthService,
    private userService: UsuarioService
  ) {
    this.initializeCurrentUser();
  }

  private initializeCurrentUser(): void {
    const currentUserId = this.authService.getCurrentUserIdSynchronous();
    this.updateState({
      ...this.currentState,
      currentUserId: currentUserId ?? this.currentState.currentUserId
    });
  }

  get currentState(): ChatState {
    return this.chatStateSubject.value;
  }

  private updateState(newState: Partial<ChatState>): void {
    this.chatStateSubject.next({ ...this.currentState, ...newState });
  }

  public loadInitialConversations(): Observable<any> {
    const { currentUserId } = this.currentState;
    if (!currentUserId) {
      return throwError(() => new Error('Usuario no autenticado.'));
    }

    this.updateState({ isLoading: true, error: null });

    return this.conversationApi.getConversationSummaries(currentUserId).pipe(
      tap(summaries => {
        const conversations: Conversation[] = summaries.map(summary =>
          this.mapSummaryToConversation(summary, currentUserId)
        );

        this.updateState({
          conversations,
          isLoading: false
        });
      }),
      catchError(err => {
        this.updateState({
          error: 'Error al cargar conversaciones.',
          isLoading: false
        });
        return throwError(() => err);
      })
    );
  }

  private mapSummaryToConversation(summary: ConversationSummary, currentUserId: number): Conversation {
    // Determine which participant is the other user (not current user)
    const otherParticipant = summary.otherParticipant || summary.participant;

    if (!otherParticipant) {
      throw new Error('No other participant found in conversation summary');
    }

    // Mapear el último mensaje si existe
    const lastMessage = summary.lastMessage ? this.mapToMessage(summary.lastMessage) : null;

    return {
      id: summary.id,
      createdAt: summary.lastMessageAt, // You might want to get this from API
      updatedAt: summary.lastMessageAt,
      participant1: this.userService.obtenerPorIdPublico(currentUserId).pipe(
        map(userData => this.mapToUsuarioDTO(userData))
      ) as unknown as UsuarioDTO, // Current user
      participant2: this.mapToUsuarioDTO(otherParticipant), // Other participant
      messages: lastMessage ? [lastMessage] : [], // Solo agregar si no es null
      providerId: otherParticipant.id, // For service compatibility
      participant: this.mapToUsuarioDTO(otherParticipant), // For service compatibility
      lastMessage: lastMessage ?? undefined,
      unreadCount: summary.unreadCount
    };
  }

  private mapToUsuarioDTO(userData: any): UsuarioDTO {
    return {
      id: userData.id,
      nombre: userData.nombre || userData.name || '',
      apellido: userData.apellido || userData.lastName || '',
      correo: userData.correo || userData.email || '',
      urlFotoPerfil: userData.urlFotoPerfil || userData.photo || userData.profilePicture || ''
    };
  }

  /**
   * Mapea los datos de un mensaje desde el formato del backend al formato del frontend.
   * Si messageData es null o undefined, retorna null.
   */
  private mapToMessage(messageData: any): Message | null {
    if (!messageData) {
      return null;
    }

    const status: Message['status'] = (messageData.status as Message['status']) ?? (messageData.isRead ? 'read' : 'delivered');
    const timestamp: Date = messageData.timestamp
      ? new Date(messageData.timestamp)
      : (messageData.sentAt ? new Date(messageData.sentAt) : new Date());

    return {
      id: messageData.id,
      conversationId: messageData.conversationId,
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      content: messageData.content,
      isRead: !!messageData.isRead,
      readAt: messageData.readAt || '',
      sentAt: messageData.sentAt || (messageData.timestamp ? new Date(messageData.timestamp).toISOString() : new Date().toISOString()),
      // Frontend-specific properties
      timestamp,
      type: (messageData.type as Message['type']) || 'text',
      status
    };
  }

  selectProvider(providerId: number | null): void {
  // Actualizar el estado inmediatamente para UI responsiva
  this.updateState({
    selectedProviderId: providerId
  });

  if (!providerId) return;

  // 1. Verificar si ya existe una conversación
  const existingConversation = this.currentState.conversations.find(
    c => c.providerId === providerId
  );

  if (existingConversation) {
    console.log('[ChatService] Conversación existente encontrada:', existingConversation);

    // Si existe pero solo tiene 1 mensaje o menos (solo el lastMessage del summary),
    // cargar todos los mensajes desde el backend
    if (existingConversation.messages.length <= 1 && existingConversation.id) {
      this.loadFullConversation(existingConversation.id, providerId);
    } else {
      // Ya tiene todos los mensajes, simplemente marcar como leídos
      this.markMessagesAsRead(providerId);
    }
  } else {
    // Si no existe, crear o recuperar la conversación del backend
    this.createOrFetchConversation(providerId);
  }
}

  /**
   * Carga todos los mensajes de una conversación existente
   */
  private loadFullConversation(conversationId: number, providerId: number): void {
    const { currentUserId } = this.currentState;
    if (!currentUserId) return;

    this.updateState({ isLoading: true });

    this.conversationApi.getConversationDetails(conversationId).pipe(
      tap(conversationDetail => {
        console.log('[ChatService] Conversación completa cargada:', conversationDetail);

        // Mapear todos los mensajes
        const allMessages = conversationDetail.messages
          .map(msg => this.mapToMessage(msg))
          .filter(m => m !== null) as Message[];

        // Actualizar la conversación existente con todos los mensajes
        const conversations = this.currentState.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: allMessages
            };
          }
          return conv;
        });

        this.updateState({
          conversations,
          isLoading: false
        });

        // Marcar mensajes como leídos
        this.markMessagesAsRead(providerId);
      }),
      catchError(error => {
        console.error('[ChatService] Error cargando conversación completa:', error);
        this.updateState({
          error: 'No se pudieron cargar los mensajes',
          isLoading: false
        });
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Crea una nueva conversación o recupera una existente desde el backend.
   * Este método llama al endpoint POST /api/conversations que busca o crea
   * la conversación entre el usuario actual y el proveedor seleccionado.
   */
  private createOrFetchConversation(providerId: number): void {
    const { currentUserId } = this.currentState;
    if (!currentUserId) return;

    this.updateState({ isLoading: true });

    // Paso 1: Crear o recuperar la conversación (obtiene solo el summary con último mensaje)
    this.conversationApi.createOrGetConversation(currentUserId, providerId).pipe(
      switchMap(conversationSummary => {
        console.log('[ChatService] Conversación creada/encontrada:', conversationSummary);

        // Paso 2: Obtener los detalles completos con todos los mensajes
        return this.conversationApi.getConversationDetails(conversationSummary.id).pipe(
          map(conversationDetail => ({ summary: conversationSummary, detail: conversationDetail }))
        );
      }),
      tap(({ summary, detail }) => {
        console.log('[ChatService] Detalles de conversación cargados:', detail);

        // Mapear los detalles a una conversación con todos los mensajes
        const allMessages = detail.messages.map(msg => this.mapToMessage(msg)).filter(m => m !== null) as Message[];

        // Convertir el resumen en conversación y actualizar con todos los mensajes
        const newConversation = this.mapSummaryToConversation(summary, currentUserId);
        newConversation.messages = allMessages; // Reemplazar el array de mensajes con todos los mensajes

        // Agregar al estado
        const conversations = [...this.currentState.conversations, newConversation];
        this.updateState({
          conversations,
          isLoading: false
        });
      }),
      catchError(error => {
        console.error('Error al crear o recuperar conversación:', error);
        this.updateState({
          error: 'No se pudo iniciar la conversación',
          isLoading: false
        });
        return of(null);
      })
    ).subscribe();
  }

sendMessage(content: string): Observable<SendMessageResponse> {
    const { selectedProviderId, currentUserId } = this.currentState;

    if (!selectedProviderId || !content.trim()) {
      return throwError(() => new Error('Provider no seleccionado o mensaje vacío'));
    }

    // Get or create conversation ID
    const conversationId = this.getOrCreateConversationId(selectedProviderId);

    // Create the message object for the API
    const newMessage: Message = {
      id: 0, // Temporary ID, will be set by backend
      conversationId: conversationId,
      senderId: currentUserId,
      receiverId: selectedProviderId,
      content: content.trim(),
      isRead: false,
      readAt: '',
      sentAt: new Date().toISOString(),
      timestamp: new Date(),
      type: 'text',
      status: 'sending'
    };

    // Send message via API
    return this.conversationApi.sendMessage(newMessage).pipe(
      switchMap(serverMessage => {
        // Update the message with server data
        this.updateMessageWithServerResponse(newMessage.id, serverMessage);

        return of({
          success: true,
          message: serverMessage
        });
      }),
      catchError(error => {
        // Mark message as failed
        this.updateMessageStatus(newMessage.id, undefined);
        return of({
          success: false,
          error: error.message || 'Error al enviar el mensaje'
        });
      })
    );
  }

    private updateMessageWithServerResponse(temporaryMessageId: number, serverMessage: Message): void {
    const conversations = this.currentState.conversations.map(conversation => ({
      ...conversation,
      messages: conversation.messages.map(message =>
        message.id === temporaryMessageId
          ? { ...serverMessage, status: 'delivered' as Message['status'] }
          : message
      ),
      lastMessage: conversation.lastMessage?.id === temporaryMessageId
        ? { ...serverMessage, status: 'delivered' as Message['status'] }
        : conversation.lastMessage
    }));

    this.updateState({ conversations });
  }

  private getOrCreateConversationId(providerId: number): number {
    const existingConversation = this.currentState.conversations.find(
      c => c.providerId === providerId
    );
    return existingConversation?.id || this.generateConversationId();
  }

  private updateMessageStatus(messageId: number, status: Message['status']): void {
    const conversations = this.currentState.conversations.map(conversation => ({
      ...conversation,
      messages: conversation.messages.map(message =>
        message.id === messageId ? { ...message, status } : message
      ),
      lastMessage: conversation.lastMessage?.id === messageId
        ? { ...conversation.lastMessage, status }
        : conversation.lastMessage
    }));

    this.updateState({ conversations });
  }

  private markMessagesAsRead(providerId: number): void {
    const conversations = this.currentState.conversations.map(conversation => {
      if (conversation.providerId === providerId) {
        return {
          ...conversation,
          unreadCount: 0,
          messages: conversation.messages.map(message =>
            message.senderId !== this.currentState.currentUserId && message.status !== 'read'
              ? { ...message, status: 'read', isRead: true, readAt: new Date().toISOString() }
              : message
          ),
          lastMessage: conversation.lastMessage &&
            conversation.lastMessage.senderId !== this.currentState.currentUserId
            ? { ...conversation.lastMessage, status: 'read', isRead: true, readAt: new Date().toISOString() }
            : conversation.lastMessage
        };
      }
      return conversation;
    });

    this.updateState({ conversations: conversations as Conversation[] });
  }

  getConversation(providerId: number): Observable<Conversation | undefined> {
    return this.chatState$.pipe(
      map(state => state.conversations.find(c => c.providerId === providerId))
    );
  }

  getSelectedProvider(): Observable<ChatProvider | null> {
    return this.chatState$.pipe(
      map(state => {
        if (!state.selectedProviderId) return null;

        // Primero buscar en el array de providers
        const provider = state.providers.find(p => p.id === state.selectedProviderId);
        if (provider) return provider;

        // Si no está en providers, buscar en las conversaciones y construir un ChatProvider temporal
        const conversation = state.conversations.find(c => c.providerId === state.selectedProviderId);
        if (conversation) {
          const participant = conversation.participant || conversation.participant2;

          if (participant) {
            // Crear un ChatProvider temporal desde los datos de la conversación
            return {
              id: state.selectedProviderId,
              nombre: participant.nombre,
              email: participant.correo,
              telefono: '',
              cedula: '',
              contactName: `${participant.nombre} ${participant.apellido || ''}`.trim(),
              photo: participant.urlFotoPerfil || 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider' + state.selectedProviderId,
              rating: 0,
              totalReviews: 0,
              services: [],
              isOnline: false,
              lastSeen: conversation.updatedAt ? new Date(conversation.updatedAt) : undefined
            };
          }
        }

        return null;
      })
    );
  }


  private generateConversationId(): number {
    return Date.now();
  }

  getTotalUnreadCount(): Observable<number> {
    return this.chatState$.pipe(
      map(state => state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0))
    );
  }

}
