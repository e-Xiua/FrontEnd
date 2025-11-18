import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { ChatLayoutService } from '../../shared/services/chat-layout.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class ChatIntegrationService {

  constructor(
    private authService: AuthService,
    private chatLayoutService: ChatLayoutService,
    private chatService: ChatService,
    private router: Router,
    private chatRealtimeService: ChatRealtimeService
  ) {}

  /**
   * Inicializa el chat para proveedores autenticados
   */
  initializeChatForProvider(): boolean {
    if (!this.authService.isAuthenticated()) {
      console.warn('Chat: Usuario no autenticado');
      return false;
    }

    console.log('Chat: Inicializado correctamente para proveedor');
    return true;
  }

  /**
   * Initializes chat for authenticated tourists.
   */
  initializeChatForTurista(): boolean {
    if (!this.authService.isAuthenticated()) {
      console.warn('Chat: Usuario no autenticado');
      return false;
    }

    // Para usuarios turista debemos asegurarnos de que:
    // 1) Se carguen las conversaciones/summaries iniciales
    // 2) Se inicie la conexión de tiempo real (STOMP / polling)

    try {
      // Cargar resúmenes/conversaciones (HTTP) para poblar la UI
      // Usamos la llamada existente en ChatService; si falla, devolvemos false
      this.chatService.loadInitialConversations().subscribe({
        next: () => {
          console.log('Chat: Conversaciones iniciales cargadas para turista');
        },
        error: (err) => {
          console.warn('Chat: Error cargando conversaciones iniciales para turista', err);
        }
      });

      // Iniciar conexión en tiempo real para recibir nuevos mensajes
      this.chatRealtimeService.connect();

      console.log('Chat: Inicializado correctamente para turista (conexión y carga realizadas)');
      return true;
    } catch (err) {
      console.error('Chat: Error inicializando chat para turista', err);
      return false;
    }
  }

  /**
   * Deshabilita el chat al salir de rutas de proveedor
   */
  disableChat(): void {
    this.chatLayoutService.reset();
    console.log('Chat: Deshabilitado');
  }

  /**
   * Obtiene información del usuario actual para el chat
   */
  getCurrentUserInfo(): any {
    if (!this.authService.isAuthenticated()) {
      return null;
    }

    // Obtener información del usuario desde localStorage o API
    const token = localStorage.getItem('token');
    const userRole = this.authService.getCurrentUserRole();

    return {
      token,
      role: userRole,
      isProvider: userRole === 'Proveedor'
    };
  }

  /**
   * Maneja errores de navegación relacionados con el chat
   */
  handleNavigationError(error: any): void {
    console.error('Chat Navigation Error:', error);

    // Lógica de fallback
    const userRole = this.authService.getCurrentUserRole();
    switch (userRole) {
      case 'Proveedor':
        this.router.navigate(['/proveedor/home']); // Nueva ruta con layout
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  /**
   * Checks if the current user has the expected role and redirects if not.
   * @param expectedRole The role to check for ('Proveedor', 'Turista', 'Admin').
   */
  checkRoleAndRedirect(expectedRole: 'Proveedor' | 'Turista' | 'Admin'): void {
    const currentUserRole = this.authService.getCurrentUserRole();
    if (currentUserRole !== expectedRole) {
      console.warn(`Chat: Acceso denegado. Rol esperado: ${expectedRole}, rol actual: ${currentUserRole}`);
      this.handleNavigationError(new Error('Mismatched role for chat access'));
    }
  }

  startChatWithProvider(providerId: number): void {
    console.log('[ChatIntegration] Iniciando chat con proveedor', providerId);

    // 2. Seleccionar el proveedor (esto carga o crea la conversación)
    this.chatService.selectProvider(providerId);

  }

  startConversationWithUser(user: any): void {
    // Asegurar que el layout del chat está inicializado y suscrito
    // al estado del ChatService para que activeConversations se actualice
    // cuando se cree/recupere la conversación.
    this.chatLayoutService.initializeChatData();

    // Iniciar o seleccionar la conversación en el ChatService
    this.chatService.startOrSelectConversationWithUser(user);

    // Mostrar el modal y navegar al tab de "conversaciones" para que
    // el usuario vea el resumen (y pueda seleccionar la conversación)
    // Si el objetivo es abrir directamente el chat activo, cambiar a 'chat'.
    this.chatLayoutService.showModal();
    this.chatLayoutService.setActiveTab('conversations');
  }
}
