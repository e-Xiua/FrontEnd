import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp, RxStompState } from '@stomp/rx-stomp';
import { BehaviorSubject, interval, Observable, Subject, timer } from 'rxjs';
import { catchError, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import SockJS from 'sockjs-client';
import { AuthService } from '../../core/services/auth/auth.service';
import { ConversationSummary } from '../models/chat';
import { ConversationApiService } from './conversation-api.service';

export interface RealtimeState {
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  newMessagesCount: number;
  newContactsCount: number;
  connectionType: 'websocket' | 'polling' | 'disconnected';
  reconnectAttempts: number;
}

/**
 * ChatRealtimeService
 *
 * Servicio de actualización en tiempo real para el sistema de chat usando WebSockets.
 * Similar al patrón usado en review-display y review-form, este servicio:
 *
 * 1. Mantiene estado reactivo con BehaviorSubject
 * 2. Usa WebSocket para tiempo real instantáneo (0ms latencia)
 * 3. Emite eventos cuando hay nuevos mensajes o contactos
 * 4. Reconexión automática en caso de desconexión
 * 5. Fallback a polling si WebSocket no está disponible
 *
 * @example
 * ```typescript
 * constructor(private realtimeService: ChatRealtimeService) {}
 *
 * ngOnInit() {
 *   this.realtimeService.connect();
 *
 *   this.realtimeService.newMessages$.subscribe(summaries => {
 *     console.log('Nuevos mensajes:', summaries);
 *     // Actualizar UI automáticamente
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ChatRealtimeService implements OnDestroy {
  // Configuración WebSocket STOMP
  // ✅ CORRECCIÓN: Usar HTTP (no WS) para SockJS, y STOMP para protocolo
  private readonly WS_URL = 'http://localhost:8089/ws'; // URL base para SockJS
  private readonly POLLING_INTERVAL = 5000; // Fallback polling: 5 segundos
  private readonly RECONNECT_INTERVAL = 3000; // Reconexión: 3 segundos
  private readonly MAX_RECONNECT_ATTEMPTS = 10;

  private destroy$ = new Subject<void>();
  private pollingSubject$ = new Subject<void>();

  // RxStomp para WebSocket STOMP
  private rxStomp: RxStomp | null = null;
  private reconnectAttempts = 0;
  private usePollingFallback = false;

  // Estado reactivo (similar a ReviewStateService)
  private stateSubject = new BehaviorSubject<RealtimeState>({
    isConnected: false,
    lastUpdate: null,
    error: null,
    newMessagesCount: 0,
    newContactsCount: 0,
    connectionType: 'disconnected',
    reconnectAttempts: 0
  });

  // Observable público para que los componentes se suscriban
  public state$ = this.stateSubject.asObservable();

  // Observables específicos para eventos
  private newMessagesSubject = new BehaviorSubject<ConversationSummary[]>([]);
  public newMessages$ = this.newMessagesSubject.asObservable();

  private newContactsSubject = new BehaviorSubject<any[]>([]);
  public newContacts$ = this.newContactsSubject.asObservable();

  // Cache de conversaciones para detectar cambios
  private lastConversationsCache = new Map<number, ConversationSummary>();
  private retryCount = 0;

  constructor(
    private conversationApi: ConversationApiService,
    private authService: AuthService
  ) {
    console.log('[ChatRealtimeService] Servicio inicializado');
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Estado actual del servicio
   */
  get currentState(): RealtimeState {
    return this.stateSubject.value;
  }

  /**
   * Verifica si el servicio está conectado
   */
  get isConnected(): boolean {
    return this.currentState.isConnected;
  }

  /**
   * Inicia la conexión (STOMP o polling como fallback)
   * Similar a como review-display carga datos automáticamente en ngOnInit
   */
  connect(): void {
    if (this.isConnected) {
      console.log('[ChatRealtimeService] Ya está conectado');
      return;
    }

    console.log('[ChatRealtimeService] Iniciando conexión STOMP...');

    // Intentar conectar con STOMP primero
    this.connectStomp();
  }

  /**
   * Detiene la conexión (STOMP o polling)
   */
  disconnect(): void {
    if (!this.isConnected) {
      return;
    }

    console.log('[ChatRealtimeService] Desconectando...');

    // Desactivar STOMP si existe
    if (this.rxStomp) {
      this.rxStomp.deactivate();
      this.rxStomp = null;
    }

    // Detener polling si está activo
    this.pollingSubject$.next();

    this.updateState({
      isConnected: false,
      connectionType: 'disconnected'
    });

    // Limpiar cache
    this.lastConversationsCache.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Forzar verificación manual (útil para botón de refresh)
   */
  forceRefresh(): Observable<void> {
    console.log('[ChatRealtimeService] Refresh manual solicitado');

    // Siempre usar HTTP para refresh manual (más confiable)
    return this.performUpdateCheck();
  }

  /**
   * Conecta usando STOMP over WebSocket con SockJS fallback
   */
  private connectStomp(): void {
    const token = this.authService.getToken();
    const userId = this.authService.getCurrentUserIdSynchronous();

    console.log(`[ChatRealtimeService] Attempting to connect for user ID: ${userId}`);
    console.log(`[ChatRealtimeService] Token available: ${!!token}`);

    if (!token || !userId) {
      console.error('[ChatRealtimeService] No hay token o userId. Usando polling como fallback.');
      this.startPollingFallback();
      return;
    }

    // Crear instancia de RxStomp
    this.rxStomp = new RxStomp();

    // Configurar RxStomp con SockJS
    this.rxStomp.configure({
      // SockJS factory con autenticación
      webSocketFactory: () => {
        const url = `${this.WS_URL}?token=${token}&userId=${userId}`;
        console.log('[ChatRealtimeService] Conectando a:', url);
        return new SockJS(url);
      },

      // Headers de conexión
      connectHeaders: {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': userId.toString()
      },

      // Heartbeat (cada 10 segundos)
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // Reconexión automática
      reconnectDelay: 3000,

      // Debug
      debug: (msg: string) => {
        console.log('[STOMP]', msg);
      }
    });

    // Observar estado de conexión
    this.rxStomp.connectionState$.subscribe(state => {
      console.log('[ChatRealtimeService] Estado STOMP:', RxStompState[state]);

      if (state === RxStompState.OPEN) {
        console.log('[ChatRealtimeService] ✅ STOMP conectado exitosamente');
        this.updateState({
          isConnected: true,
          connectionType: 'websocket',
          error: null
        });
        this.reconnectAttempts = 0;
        this.usePollingFallback = false; // Desactivar polling si STOMP funciona

        // Suscribirse a los canales
        this.subscribeToStompChannels();

      } else if (state === RxStompState.CLOSED) {
        console.warn('[ChatRealtimeService] ⚠️ STOMP cerrado');
        this.updateState({
          isConnected: false,
          connectionType: 'disconnected'
        });

        // Solo usar polling si excedemos el máximo de reintentos
        // STOMP seguirá intentando reconectar automáticamente cada 3 segundos
        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          console.log(`[ChatRealtimeService] 🔄 STOMP reintentará automáticamente (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
        } else if (!this.usePollingFallback) {
          console.warn('[ChatRealtimeService] ⚠️ Máximo de reintentos STOMP alcanzado. Cambiando a polling como último recurso.');
          this.startPollingFallback();
        }
      }
    });

    // Activar conexión
    this.rxStomp.activate();
  }

  /**
   * Suscribirse a los canales STOMP
   */
  private subscribeToStompChannels(): void {
    if (!this.rxStomp) {
      console.error('[ChatRealtimeService] RxStomp no está inicializado');
      return;
    }

    const userId = this.authService.getCurrentUserIdSynchronous();
    if (!userId) {
      console.error('[ChatRealtimeService] No hay userId para suscribirse');
      return;
    }

    console.log('[ChatRealtimeService] Suscribiéndose a canales STOMP...');

    // Suscribirse a mensajes privados: /user/queue/messages
    this.rxStomp.watch(`/user/queue/messages`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const payload = JSON.parse(message.body);
        console.log('[ChatRealtimeService] 📨 Nuevo mensaje recibido:', payload);
        this.handleNewMessage(payload);
      });

    // Suscribirse a notificaciones de lectura: /user/queue/read-receipts
    this.rxStomp.watch(`/user/queue/read-receipts`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const payload = JSON.parse(message.body);
        console.log('[ChatRealtimeService] 📖 Mensaje leído:', payload);
        this.handleMessageRead(payload);
      });

    // Suscribirse a indicadores de escritura: /user/queue/typing
    this.rxStomp.watch(`/user/queue/typing`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        const payload = JSON.parse(message.body);
        console.log('[ChatRealtimeService] ⌨️ Usuario escribiendo:', payload);
        this.handleTypingIndicator(payload);
      });

    console.log('[ChatRealtimeService] ✅ Suscripciones STOMP activas');
  }

  /**
   * Programa un reintento de reconexión
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;

    console.log(`[ChatRealtimeService] 🔄 Reconectando en ${this.RECONNECT_INTERVAL}ms (intento ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);

    this.updateState({
      error: `Reconectando... (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`,
      reconnectAttempts: this.reconnectAttempts
    });

    timer(this.RECONNECT_INTERVAL).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (!this.isConnected) {
        this.connectStomp();
      }
    });
  }

  /**
   * Maneja un nuevo mensaje
   */
  private handleNewMessage(payload: any): void {
    console.log('[ChatRealtimeService] 🔔 Nuevo mensaje:', payload);

    // Actualizar cache y emitir evento
    if (payload.conversationSummary) {
      const summary = payload.conversationSummary as ConversationSummary;

      // Actualizar cache
      this.lastConversationsCache.set(summary.id, summary);

      // Emitir evento
      this.newMessagesSubject.next([summary]);

      // Incrementar contador
      this.updateState({
        newMessagesCount: this.currentState.newMessagesCount + 1
      });
    }
  }



  /**
   * Maneja mensaje leído
   */
  private handleMessageRead(payload: any): void {
    console.log('[ChatRealtimeService] ✅ Mensaje leído:', payload);

    // Actualizar cache si existe la conversación
    if (payload.conversationId) {
      const cached = this.lastConversationsCache.get(payload.conversationId);
      if (cached) {
        cached.unreadCount = Math.max(0, (cached.unreadCount || 0) - 1);
        this.lastConversationsCache.set(cached.id, cached);
      }
    }
  }

  /**
   * Maneja indicadores de escritura (typing)
   */
  private handleTypingIndicator(payload: any): void {
    console.log('[ChatRealtimeService] ⌨️ Usuario escribiendo:', payload);
    // Aquí puedes emitir un evento para mostrar "Usuario está escribiendo..."
    // Por ejemplo: this.typingIndicatorSubject.next(payload);
  }

  /**
   * Inicia polling como fallback si WebSocket no está disponible
   */
  private startPollingFallback(): void {
    if (this.usePollingFallback) {
      console.log('[ChatRealtimeService] ⚠️ Polling ya está activo, ignorando llamada duplicada');
      return;
    }

    console.warn('[ChatRealtimeService] ⚠️ INICIANDO POLLING COMO FALLBACK (esto NO debería suceder si STOMP funciona)');

    this.usePollingFallback = true;

    this.updateState({
      isConnected: true,
      connectionType: 'polling',
      error: 'STOMP no disponible, usando HTTP polling',
      lastUpdate: new Date()
    });

    // Realizar primera carga
    this.performUpdateCheck().subscribe();

    // Iniciar polling periódico
    this.startPolling();
  }

  /**
   * Inicia el ciclo de polling (solo como fallback)
   */
  private startPolling(): void {
    interval(this.POLLING_INTERVAL).pipe(
      takeUntil(this.pollingSubject$),
      takeUntil(this.destroy$),
      filter(() => this.usePollingFallback && this.isConnected),
      switchMap(() => this.performUpdateCheck()),
      catchError((error): any[] => {
        console.error('[ChatRealtimeService] Error en polling:', error);
        this.handlePollingError(error);
        return [];
      })
    ).subscribe();
  }

  /**
   * Realiza la verificación de actualizaciones
   */
  private performUpdateCheck(): Observable<void> {
    const currentUserId = this.authService.getCurrentUserIdSynchronous();

    if (!currentUserId) {
      console.warn('[ChatRealtimeService] ⚠️ Usuario no autenticado, saltando actualización');
      return new Observable(observer => observer.complete());
    }

    console.log('[ChatRealtimeService] 🔍 Realizando HTTP polling check...');

    return this.conversationApi.getConversationSummaries(currentUserId).pipe(
      tap(summaries => {
        console.log(`[ChatRealtimeService] ✅ Polling completado: ${summaries.length} conversaciones`);
        this.processConversationUpdates(summaries);
        this.resetRetryCount();

        this.updateState({
          lastUpdate: new Date(),
          error: null
        });
      }),
      catchError(error => {
        console.error('[ChatRealtimeService] ❌ Error en polling:', error);
        this.handlePollingError(error);
        throw error;
      }),
      switchMap(() => new Observable<void>(observer => observer.complete()))
    );
  }

  /**
   * Procesa las conversaciones y detecta cambios
   * Similar a cómo review-display detecta nuevas reseñas
   */
  private processConversationUpdates(summaries: ConversationSummary[]): void {
    const newMessages: ConversationSummary[] = [];
    let newMessagesCount = 0;

    summaries.forEach(summary => {
      const cached = this.lastConversationsCache.get(summary.id);

      if (!cached) {
        // Nueva conversación
        newMessages.push(summary);
        this.lastConversationsCache.set(summary.id, summary);
      } else {
        // Verificar si hay mensaje nuevo
        const hasNewMessage = this.hasNewMessage(cached, summary);

        if (hasNewMessage) {
          newMessages.push(summary);
          newMessagesCount++;
        }

        // Actualizar cache
        this.lastConversationsCache.set(summary.id, summary);
      }
    });

    // Emitir evento si hay cambios
    if (newMessages.length > 0) {
      console.log(`[ChatRealtimeService] 🔔 ${newMessages.length} conversaciones con cambios detectadas`);
      this.newMessagesSubject.next(newMessages);

      this.updateState({
        newMessagesCount: this.currentState.newMessagesCount + newMessagesCount
      });
    }
  }

  /**
   * Verifica si una conversación tiene un mensaje nuevo
   */
  private hasNewMessage(cached: ConversationSummary, current: ConversationSummary): boolean {
    // Comparar timestamp del último mensaje
    if (!cached.lastMessage || !current.lastMessage) {
      return false;
    }

    const cachedTime = new Date(cached.lastMessageAt).getTime();
    const currentTime = new Date(current.lastMessageAt).getTime();

    return currentTime > cachedTime;
  }

  /**
   * Maneja errores de polling
   */
  private handlePollingError(error: any): void {
    // Para polling fallback, simplemente registrar el error
    console.error('[ChatRealtimeService] Error en polling fallback:', error);

    this.updateState({
      error: 'Error al actualizar datos'
    });
  }

  /**
   * Reinicia el contador de reintentos (no usado con WebSocket)
   */
  private resetRetryCount(): void {
    // Método mantenido para compatibilidad, pero ya no se usa contador de reintentos
    // Con WebSocket se usa reconnectAttempts directamente
  }

  /**
   * Actualiza el estado interno
   */
  private updateState(updates: Partial<RealtimeState>): void {
    this.stateSubject.next({
      ...this.currentState,
      ...updates
    });
  }

  /**
   * Limpia el contador de nuevos mensajes
   */
  clearNewMessagesCount(): void {
    this.updateState({ newMessagesCount: 0 });
  }

  /**
   * Limpia el contador de nuevos contactos
   */
  clearNewContactsCount(): void {
    this.updateState({ newContactsCount: 0 });
  }

  /**
   * Marca una conversación como vista (elimina del cache de nuevas)
   */
  markConversationAsViewed(conversationId: number): void {
    const conversation = this.lastConversationsCache.get(conversationId);
    if (conversation) {
      // Actualizar timestamp para que no se detecte como nuevo
      this.lastConversationsCache.set(conversationId, {
        ...conversation,
        unreadCount: 0
      });
    }
  }

  /**
   * Obtener estadísticas de conexión
   */
  getConnectionStats(): {
    isConnected: boolean;
    connectionType: 'websocket' | 'polling' | 'disconnected';
    lastUpdate: Date | null;
    conversationsCached: number;
    newMessagesCount: number;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      connectionType: this.currentState.connectionType,
      lastUpdate: this.currentState.lastUpdate,
      conversationsCached: this.lastConversationsCache.size,
      newMessagesCount: this.currentState.newMessagesCount,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Verifica si está usando WebSocket
   */
  isUsingWebSocket(): boolean {
    return this.currentState.connectionType === 'websocket';
  }

  /**
   * Verifica si está usando polling
   */
  isUsingPolling(): boolean {
    return this.currentState.connectionType === 'polling';
  }

  /**
   * Envía un mensaje usando STOMP
   * @param message Mensaje a enviar
   * @returns true si se envió vía STOMP, false si hay que usar HTTP fallback
   */
  sendMessageViaStompIfConnected(message: any): boolean {
    if (!this.rxStomp || !this.isConnected || this.currentState.connectionType !== 'websocket') {
      console.log('[ChatRealtimeService] No conectado a STOMP, usar HTTP fallback');
      return false;
    }

    try {
      this.rxStomp.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(message)
      });

      console.log('[ChatRealtimeService] 📤 Mensaje enviado vía STOMP:', message);
      return true;
    } catch (error) {
      console.error('[ChatRealtimeService] Error enviando mensaje vía STOMP:', error);
      return false;
    }
  }

  /**
   * Marca un mensaje como leído usando STOMP
   * @param messageId ID del mensaje a marcar como leído
   * @returns true si se envió vía STOMP, false si hay que usar HTTP fallback
   */
  markMessageAsReadViaStompIfConnected(messageId: number): boolean {
    if (!this.rxStomp || !this.isConnected || this.currentState.connectionType !== 'websocket') {
      console.log('[ChatRealtimeService] No conectado a STOMP, usar HTTP fallback');
      return false;
    }

    try {
      this.rxStomp.publish({
        destination: '/app/chat.read',
        body: JSON.stringify({ messageId })
      });

      console.log('[ChatRealtimeService] 📖 Mensaje marcado como leído vía STOMP:', messageId);
      return true;
    } catch (error) {
      console.error('[ChatRealtimeService] Error marcando mensaje como leído vía STOMP:', error);
      return false;
    }
  }

  /**
   * Notifica que el usuario está escribiendo usando STOMP
   * @param conversationId ID de la conversación
   * @returns true si se envió vía STOMP, false si hay que usar HTTP fallback
   */
  notifyTypingViaStompIfConnected(conversationId: number): boolean {
    if (!this.rxStomp || !this.isConnected || this.currentState.connectionType !== 'websocket') {
      return false; // No hacer nada si no está conectado (typing no es crítico)
    }

    try {
      this.rxStomp.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ conversationId })
      });

      console.log('[ChatRealtimeService] ⌨️ Notificación de escritura enviada vía STOMP');
      return true;
    } catch (error) {
      console.error('[ChatRealtimeService] Error enviando notificación de escritura:', error);
      return false;
    }
  }

  /**
   * Obtiene el servicio RxStomp (para usos avanzados)
   * Solo usar si necesitas acceso directo al cliente STOMP
   */
  getRxStomp(): RxStomp | null {
    return this.rxStomp;
  }

  /**
   * Limpia el cache de conversaciones (usado al cerrar sesión)
   * Previene que otro usuario vea datos del usuario anterior
   */
  clearCache(): void {
    console.log('[ChatRealtimeService] 🧹 Limpiando cache de conversaciones...');

    // Limpiar cache de conversaciones
    this.lastConversationsCache.clear();

    // Resetear contadores
    this.updateState({
      newMessagesCount: 0,
      newContactsCount: 0,
      lastUpdate: null
    });

    // Limpiar subjects
    this.newMessagesSubject.next([]);
    this.newContactsSubject.next([]);

    console.log('[ChatRealtimeService] ✅ Cache limpiado');
  }
}
