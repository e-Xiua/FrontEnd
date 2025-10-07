import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import {
  ChatProvider,
  ChatState,
  Conversation,
  Message,
  SendMessageResponse
} from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatStateSubject = new BehaviorSubject<ChatState>({
    providers: [],
    conversations: [],
    selectedProviderId: null,
    currentUserId: 1, // Usuario actual mock
    isLoading: false,
    error: null
  });

  public chatState$ = this.chatStateSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  // Estado actual
  get currentState(): ChatState {
    return this.chatStateSubject.value;
  }

  // Inicializar datos mock
  public initializeMockData(): void {
    const mockProviders: ChatProvider[] = [
      {
        id: 1,
        nombre: 'Spa Wellness Centro',
        email: 'contact@spawellness.com',
        telefono: '+506 2222-3333',
        cedula: '123456789',
        proveedorInfo: {
          nombreEmpresa: 'Spa Wellness Centro',
          descripcion: 'Centro de relajación y bienestar',
          latitud: 10.001,
          longitud: -84.001,
          telefono: '+506 2222-3333',
          email: 'contact@spawellness.com',
          sitioWeb: 'https://spawellness.com'
        },
        contactName: 'María González',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
        rating: 4.8,
        totalReviews: 125,
        isOnline: true,
        services: [
          {
            id: 1,
            name: 'Masaje Relajante',
            description: 'Masaje de cuerpo completo para relajación total',
            price: 45000,
            currency: 'CRC',
            duration: 60,
            category: 'Spa',
            available: true
          },
          {
            id: 2,
            name: 'Tratamiento Facial',
            description: 'Limpieza facial profunda con productos naturales',
            price: 35000,
            currency: 'CRC',
            duration: 45,
            category: 'Belleza',
            available: true
          }
        ]
      },
      {
        id: 2,
        nombre: 'Aventura Tours CR',
        email: 'info@aventuracr.com',
        telefono: '+506 2333-4444',
        cedula: '987654321',
        proveedorInfo: {
          nombreEmpresa: 'Aventura Tours CR',
          descripcion: 'Tours de aventura y naturaleza',
          latitud: 10.002,
          longitud: -84.002,
          telefono: '+506 2333-4444',
          email: 'info@aventuracr.com',
          sitioWeb: 'https://aventuracr.com'
        },
        contactName: 'Carlos Ramírez',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
        rating: 4.9,
        totalReviews: 98,
        isOnline: false,
        lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
        services: [
          {
            id: 3,
            name: 'Tour Canopy',
            description: 'Aventura en las copas de los árboles',
            price: 25000,
            currency: 'CRC',
            duration: 120,
            category: 'Aventura',
            available: true
          }
        ]
      }
    ];

    const mockConversations: Conversation[] = [
      {
        id: '1',
        providerId: 1,
        messages: [
          {
            id: '1',
            senderId: 1,
            content: '¡Hola! Bienvenido a Spa Wellness Centro. ¿En qué podemos ayudarte hoy?',
            timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
            type: 'text',
            status: 'read'
          },
          {
            id: '2',
            senderId: 0,
            content: 'Hola, me interesa saber sobre sus servicios de masajes.',
            timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 minutos atrás
            type: 'text',
            status: 'read'
          },
          {
            id: '3',
            senderId: 1,
            content: 'Perfecto! Tenemos varios tipos de masajes disponibles. Nuestro masaje relajante de cuerpo completo es muy popular. ¿Te gustaría conocer más detalles?',
            timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 minutos atrás
            type: 'text',
            status: 'read'
          }
        ],
        unreadCount: 0,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
        updatedAt: new Date(Date.now() - 50 * 60 * 1000)
      },
      {
        id: '2',
        providerId: 2,
        messages: [
          {
            id: '4',
            senderId: 2,
            content: '¡Hola! Gracias por contactar Aventura Tours CR. ¿Buscas alguna aventura específica?',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
            type: 'text',
            status: 'delivered'
          }
        ],
        unreadCount: 1,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
        updatedAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    this.updateState({
      ...this.currentState,
      providers: mockProviders,
      conversations: mockConversations
    });
  }

  // Actualizar estado
  private updateState(newState: ChatState): void {
    this.chatStateSubject.next(newState);
  }

  // Seleccionar provider
  selectProvider(providerId: number | null): void {
    this.updateState({
      ...this.currentState,
      selectedProviderId: providerId
    });

    // Marcar mensajes como leídos si hay una conversación
    if (providerId) {
      this.markMessagesAsRead(providerId);
    }
  }

  // Enviar mensaje
  sendMessage(content: string): Observable<SendMessageResponse> {
    const { selectedProviderId, currentUserId } = this.currentState;

    if (!selectedProviderId || !content.trim()) {
      return throwError(() => new Error('Provider no seleccionado o mensaje vacío'));
    }

    const newMessage: Message = {
      id: this.generateMessageId(),
      senderId: currentUserId,
      content: content.trim(),
      timestamp: new Date(),
      type: 'text',
      status: 'sending'
    };

    // Agregar mensaje a la conversación
    this.addMessageToConversation(selectedProviderId, newMessage);

    // Simular envío y respuesta automática del provider
    return of({ success: true, message: newMessage }).pipe(
      delay(500),
      tap(() => {
        // Marcar como enviado
        this.updateMessageStatus(newMessage.id, 'sent');
      }),
      delay(1000),
      tap(() => {
        // Marcar como entregado
        this.updateMessageStatus(newMessage.id, 'delivered');

        // Simular respuesta automática del provider (solo para demo)
        if (Math.random() > 0.5) {
          this.simulateProviderResponse(selectedProviderId);
        }
      })
    );
  }

  // Agregar mensaje a conversación
  private addMessageToConversation(providerId: number, message: Message): void {
    const conversations = [...this.currentState.conversations];
    const conversationIndex = conversations.findIndex(c => c.providerId === providerId);

    if (conversationIndex >= 0) {
      conversations[conversationIndex] = {
        ...conversations[conversationIndex],
        messages: [...conversations[conversationIndex].messages, message],
        lastMessage: message,
        updatedAt: new Date()
      };
    } else {
      // Crear nueva conversación
      const newConversation: Conversation = {
        id: this.generateConversationId(),
        providerId,
        messages: [message],
        lastMessage: message,
        unreadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      conversations.push(newConversation);
    }

    this.updateState({
      ...this.currentState,
      conversations
    });
  }

  // Actualizar estado del mensaje
  private updateMessageStatus(messageId: string, status: Message['status']): void {
    const conversations = this.currentState.conversations.map(conversation => ({
      ...conversation,
      messages: conversation.messages.map(message =>
        message.id === messageId ? { ...message, status } : message
      )
    }));

    this.updateState({
      ...this.currentState,
      conversations
    });
  }

  // Simular respuesta automática del provider
  private simulateProviderResponse(providerId: number): void {
    const responses = [
      '¡Gracias por tu mensaje! Te responderemos pronto.',
      '¿Hay algo más en lo que pueda ayudarte?',
      'Perfecto, estaremos en contacto contigo.',
      '¡Excelente pregunta! Déjame conseguir esa información para ti.',
      'Apreciamos tu interés en nuestros servicios.'
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const providerMessage: Message = {
      id: this.generateMessageId(),
      senderId: providerId,
      content: randomResponse,
      timestamp: new Date(),
      type: 'text',
      status: 'sent'
    };

    setTimeout(() => {
      this.addMessageToConversation(providerId, providerMessage);

      // Incrementar contador de no leídos si no es el provider seleccionado
      if (this.currentState.selectedProviderId !== providerId) {
        this.incrementUnreadCount(providerId);
      }
    }, 2000 + Math.random() * 3000); // Entre 2-5 segundos
  }

  // Marcar mensajes como leídos
  private markMessagesAsRead(providerId: number): void {
    const conversations = this.currentState.conversations.map(conversation => {
      if (conversation.providerId === providerId) {
        return {
          ...conversation,
          unreadCount: 0,
          messages: conversation.messages.map(message =>
            message.senderId !== this.currentState.currentUserId && message.status !== 'read'
              ? { ...message, status: 'read' as const }
              : message
          )
        };
      }
      return conversation;
    });

    this.updateState({
      ...this.currentState,
      conversations
    });
  }

  // Incrementar contador de no leídos
  private incrementUnreadCount(providerId: number): void {
    const conversations = this.currentState.conversations.map(conversation =>
      conversation.providerId === providerId
        ? { ...conversation, unreadCount: conversation.unreadCount + 1 }
        : conversation
    );

    this.updateState({
      ...this.currentState,
      conversations
    });
  }

  // Obtener conversación por provider ID
  getConversation(providerId: number): Observable<Conversation | undefined> {
    return this.chatState$.pipe(
      map(state => state.conversations.find(c => c.providerId === providerId))
    );
  }

  // Obtener provider seleccionado
  getSelectedProvider(): Observable<ChatProvider | null> {
    return this.chatState$.pipe(
      map(state => {
        if (!state.selectedProviderId) return null;
        return state.providers.find(p => p.id === state.selectedProviderId) || null;
      })
    );
  }

  // Generar ID único para mensaje
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generar ID único para conversación
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obtener total de mensajes no leídos
  getTotalUnreadCount(): Observable<number> {
    return this.chatState$.pipe(
      map(state => state.conversations.reduce((total, conv) => total + conv.unreadCount, 0))
    );
  }

  // Limpiar conversación
  clearConversation(providerId: number): void {
    const conversations = this.currentState.conversations.filter(c => c.providerId !== providerId);

    this.updateState({
      ...this.currentState,
      conversations,
      selectedProviderId: this.currentState.selectedProviderId === providerId
        ? null
        : this.currentState.selectedProviderId
    });
  }
}
