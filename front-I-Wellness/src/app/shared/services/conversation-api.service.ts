import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../../core/services/auth/auth.service';
import { Conversation, ConversationSummary, Message } from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class ConversationApiService {
  private apiUrl = 'http://localhost:8089/api'; // URL base de tu messaging-api

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const userId = this.authService.getCurrentUserIdSynchronous();

    console.log('User ID obtenido para ConversationApiService:', userId);

    if (!token || userId == null) {
      throw new Error('Token o User ID no disponibles para la petición de API');
    }

    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'X-User-Id': String(userId)
    });
  }

  /**
   * Llama a GET /api/users/{userId}/conversations
   */
  getConversationSummaries(userId: number): Observable<ConversationSummary[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ConversationSummary[]>(`${this.apiUrl}/users/${userId}/conversations`, { headers });
  }

  /**
   * Llama a GET /api/conversations/{conversationId}
   */
  getConversationDetails(conversationId: number): Observable<Conversation> {
    const headers = this.getAuthHeaders();
    return this.http.get<Conversation>(`${this.apiUrl}/conversations/${conversationId}`, { headers });
  }

  /**
   * Llama a POST /api/messages
   */
  sendMessage(message: Message): Observable<Message> {
    const headers = this.getAuthHeaders();
    return this.http.post<Message>(`${this.apiUrl}/messages`, message, { headers });
  }

  /**
   * Llama a POST /api/conversations para crear o recuperar una conversación entre dos usuarios.
   * Útil cuando el usuario quiere iniciar un chat con un contacto desde la lista.
   *
   * @param senderId El ID del usuario que inicia la conversación
   * @param receiverId El ID del usuario con quien se quiere hablar
   * @returns Observable con el resumen de la conversación creada o encontrada
   */
  createOrGetConversation(senderId: number, receiverId: number): Observable<ConversationSummary> {
    const headers = this.getAuthHeaders();
    const body = { senderId, receiverId };
    return this.http.post<ConversationSummary>(`${this.apiUrl}/conversations`, body, { headers });
  }
}
