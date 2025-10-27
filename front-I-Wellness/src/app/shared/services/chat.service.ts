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
import { ChatRealtimeService } from './chat-realtime.service';
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

  private isInitialized = false;

  constructor(
    private conversationApi: ConversationApiService,
    private authService: AuthService,
    private userService: UsuarioService,
    private realtimeService: ChatRealtimeService
  ) {
    // NO auto-conectar aquí para evitar requests sin autenticación
    // El chat se inicializará cuando el usuario lo necesite
    console.log('[ChatService] Servicio creado (sin auto-conexión)');
  }

  private initializeCurrentUser(): void {
    const currentUserId = this.authService.getCurrentUserIdSynchronous();
    this.updateState({
      ...this.currentState,
      currentUserId: currentUserId ?? this.currentState.currentUserId
    });
  }

  /**
   * Inicializa el servicio de chat (lazy initialization)
   * Solo se llama cuando hay un usuario autenticado
   */
  private initialize(): void {
    if (this.isInitialized) {
      console.log('[ChatService] Ya inicializado');
      return;
    }

    // Verificar que hay usuario autenticado
    const currentUserId = this.authService.getCurrentUserIdSynchronous();
    if (!currentUserId) {
      console.warn('[ChatService] No se puede inicializar sin usuario autenticado');
      return;
    }

    console.log('[ChatService] Inicializando para usuario:', currentUserId);

    // Actualizar userId en el estado
    this.initializeCurrentUser();

    // Configurar actualizaciones en tiempo real
    this.setupRealtimeUpdates();

    this.isInitialized = true;
    console.log('[ChatService] ✅ Inicialización completada');
  }

  /**
   * Configura las actualizaciones en tiempo real usando STOMP
   * Escucha nuevos mensajes y actualiza el estado automáticamente
   */
  private setupRealtimeUpdates(): void {
    // Conectar al servicio de tiempo real
    this.realtimeService.connect();

    // Suscribirse a nuevos mensajes
    this.realtimeService.newMessages$.subscribe(summaries => {
      if (summaries.length > 0) {
        console.log('[ChatService] Nuevos mensajes recibidos vía STOMP:', summaries);
        this.handleRealtimeMessages(summaries);
      }
    });

    // Suscribirse al estado de conexión
    this.realtimeService.state$.subscribe(state => {
      console.log('[ChatService] Estado de conexión:', state.connectionType, 'Connected:', state.isConnected);
    });
  }

  /**
   * Maneja mensajes recibidos en tiempo real vía STOMP
   */
  private handleRealtimeMessages(summaries: ConversationSummary[]): void {
    const { currentUserId } = this.currentState;
    if (!currentUserId) return;

    const updatedConversations = [...this.currentState.conversations];

    summaries.forEach(summary => {
      const existingIndex = updatedConversations.findIndex(c => c.id === summary.id);

      if (existingIndex >= 0) {
        // Actualizar conversación existente
        const existingConv = updatedConversations[existingIndex];
        const lastMessage = summary.lastMessage ? this.mapToMessage(summary.lastMessage) : null;

        // Verificar si el mensaje ya existe en el array (evitar duplicados)
        const messageExists = lastMessage && existingConv.messages.some(m =>
          m.id === lastMessage.id ||
          (m.content === lastMessage.content &&
           Math.abs(new Date(m.sentAt).getTime() - new Date(lastMessage.sentAt).getTime()) < 1000)
        );

        updatedConversations[existingIndex] = {
          ...existingConv,
          lastMessage: lastMessage ?? undefined,
          unreadCount: summary.unreadCount,
          updatedAt: summary.lastMessageAt
        };

        // Si el mensaje es nuevo y la conversación está seleccionada, agregarlo a los mensajes
        if (lastMessage && this.currentState.selectedProviderId === existingConv.providerId && !messageExists) {
          // Reemplazar mensaje temporal si existe (enviado vía STOMP)
          const tempMessageIndex = existingConv.messages.findIndex(m =>
            (m.status === 'sending' || m.status === 'delivered') &&
            m.content === lastMessage.content &&
            m.senderId === lastMessage.senderId
          );

          if (tempMessageIndex >= 0) {
            // Reemplazar mensaje temporal con el mensaje real del servidor
            console.log('[ChatService] 🔄 Reemplazando mensaje temporal ID:', existingConv.messages[tempMessageIndex].id, 'con mensaje del servidor ID:', lastMessage.id);
            updatedConversations[existingIndex].messages = [
              ...existingConv.messages.slice(0, tempMessageIndex),
              lastMessage,
              ...existingConv.messages.slice(tempMessageIndex + 1)
            ];
          } else {
            // Agregar mensaje nuevo al final
            console.log('[ChatService] ➕ Agregando mensaje nuevo al final ID:', lastMessage.id);
            updatedConversations[existingIndex].messages = [
              ...existingConv.messages,
              lastMessage
            ];
          }
        }
      } else {
        // Nueva conversación
        const newConversation = this.mapSummaryToConversation(summary, currentUserId);
        updatedConversations.push(newConversation);
      }
    });

    this.updateState({ conversations: updatedConversations });
  }

  get currentState(): ChatState {
    return this.chatStateSubject.value;
  }

  private updateState(newState: Partial<ChatState>): void {
    this.chatStateSubject.next({ ...this.currentState, ...newState });
  }

  public loadInitialConversations(): Observable<any> {
    // Asegurar que el servicio está inicializado
    this.initialize();

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
  // Asegurar que el servicio está inicializado
  this.initialize();

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

  /**
   * Envía un mensaje. Intenta usar STOMP si está conectado, sino usa HTTP
   * @param content Contenido del mensaje
   * @returns Observable con la respuesta del envío
   */
  sendMessage(content: string): Observable<SendMessageResponse> {
    // Asegurar que el servicio está inicializado
    this.initialize();

    const { selectedProviderId, currentUserId } = this.currentState;

    if (!selectedProviderId || !content.trim()) {
      return throwError(() => new Error('Provider no seleccionado o mensaje vacío'));
    }

    // Get or create conversation ID
    const conversationId = this.getOrCreateConversationId(selectedProviderId);

    // Create the message object with a unique temporary ID
    // Usar timestamp + random para evitar colisiones con mensajes rápidos
    const tempId = Date.now() + Math.random();

    const newMessage: Message = {
      id: tempId,
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

    // Agregar mensaje optimísticamente a la UI
    this.addMessageToConversation(selectedProviderId, newMessage);

    // Intentar enviar vía STOMP primero
    const sentViaStompSuccessfully = this.realtimeService.sendMessageViaStompIfConnected({
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      content: newMessage.content
    });

    if (sentViaStompSuccessfully) {
      console.log('[ChatService] 📤 Mensaje enviado vía STOMP, esperando confirmación del servidor');

      // Marcar como enviado (el servidor enviará confirmación vía WebSocket)
      this.updateMessageStatus(tempId, 'delivered');

      return of({
        success: true,
        message: newMessage
      });
    }

    // Fallback a HTTP si STOMP no está disponible
    console.log('[ChatService] 📤 Enviando mensaje vía HTTP (fallback)');

    return this.conversationApi.sendMessage(newMessage).pipe(
      tap(serverMessage => {
        // Reemplazar el mensaje temporal con el del servidor (evita duplicados)
        this.replaceTemporaryMessage(tempId, serverMessage);
      }),
      map(serverMessage => ({
        success: true,
        message: serverMessage
      })),
      catchError(error => {
        // Marcar mensaje como enviado pero con error en consola
        this.updateMessageStatus(tempId, 'sent');
        console.error('[ChatService] Error enviando mensaje vía HTTP:', error);
        return of({
          success: false,
          error: error.message || 'Error al enviar el mensaje'
        });
      })
    );
  }

  /**
   * Reemplaza un mensaje temporal con el mensaje real del servidor
   * Esto evita duplicados y superposiciones
   */
  private replaceTemporaryMessage(tempId: number, serverMessage: Message): void {
    const conversations = this.currentState.conversations.map(conversation => ({
      ...conversation,
      messages: conversation.messages.map(message =>
        message.id === tempId
          ? { ...serverMessage, status: 'delivered' as Message['status'], timestamp: new Date(serverMessage.sentAt) }
          : message
      ),
      lastMessage: conversation.lastMessage?.id === tempId
        ? { ...serverMessage, status: 'delivered' as Message['status'], timestamp: new Date(serverMessage.sentAt) }
        : conversation.lastMessage
    }));

    this.updateState({ conversations });
  }

  /**
   * Agrega un mensaje a la conversación especificada (actualización optimista)
   */
  private addMessageToConversation(providerId: number, message: Message): void {
    const conversations = this.currentState.conversations.map(conversation => {
      if (conversation.providerId === providerId) {
        return {
          ...conversation,
          messages: [...conversation.messages, message],
          lastMessage: message,
          updatedAt: message.sentAt
        };
      }
      return conversation;
    });

    this.updateState({ conversations });
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
    const conversation = this.currentState.conversations.find(c => c.providerId === providerId);

    if (!conversation) return;

    // Intentar marcar como leídos usando STOMP para cada mensaje no leído
    const unreadMessages = conversation.messages.filter(
      msg => msg.senderId !== this.currentState.currentUserId && msg.status !== 'read'
    );

    unreadMessages.forEach(message => {
      const sentViaStompSuccessfully = this.realtimeService.markMessageAsReadViaStompIfConnected(message.id);

      if (sentViaStompSuccessfully) {
        console.log('[ChatService] 📖 Mensaje marcado como leído vía STOMP:', message.id);
      } else {
        // Fallback a HTTP si STOMP no está disponible
        // TODO: Implementar endpoint HTTP para marcar como leído si es necesario
        console.log('[ChatService] 📖 Marcando como leído localmente (sin STOMP/HTTP)');
      }
    });

    // Actualizar estado local inmediatamente (actualización optimista)
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

  /**
   * Notifica que el usuario está escribiendo (solo vía STOMP)
   * @param providerId ID del proveedor al que se le está escribiendo
   */
  notifyTyping(providerId: number): void {
    const conversation = this.currentState.conversations.find(c => c.providerId === providerId);

    if (!conversation) return;

    this.realtimeService.notifyTypingViaStompIfConnected(conversation.id);
  }

  /**
   * Obtiene el estado de conexión del servicio en tiempo real
   */
  getRealtimeConnectionState(): Observable<any> {
    return this.realtimeService.state$;
  }

  /**
   * Verifica si está usando WebSocket/STOMP
   */
  isUsingWebSocket(): boolean {
    return this.realtimeService.isUsingWebSocket();
  }

  /**
   * Fuerza una actualización manual de las conversaciones
   */
  forceRefreshConversations(): Observable<void> {
    return this.realtimeService.forceRefresh();
  }

  /**
   * Desconecta el servicio en tiempo real (útil al cerrar sesión)
   */
  disconnectRealtime(): void {
    this.realtimeService.disconnect();
  }

  /**
   * Reconecta el servicio en tiempo real (útil al abrir la app de nuevo)
   */
  reconnectRealtime(): void {
    this.realtimeService.connect();
  }

  /**
   * Limpia todos los datos del chat (al cerrar sesión)
   * Previene que otro usuario vea las conversaciones del usuario anterior
   */
  clearData(): void {
    console.log('[ChatService] 🧹 Limpiando datos del chat...');

    // 1. Desconectar tiempo real
    this.disconnectRealtime();

    // 2. Limpiar cache del servicio en tiempo real
    this.realtimeService.clearCache();

    // 3. Resetear flag de inicialización
    this.isInitialized = false;

    // 4. Resetear estado a valores iniciales
    this.chatStateSubject.next({
      providers: [],
      conversations: [],
      selectedProviderId: null,
      currentUserId: 0, // Valor temporal, se actualizará con el próximo usuario
      isLoading: false,
      error: null
    });

    console.log('[ChatService] ✅ Datos del chat limpiados completamente');
  }
}
