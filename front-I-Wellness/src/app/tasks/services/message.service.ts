import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageDto } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly baseUrl = 'http://localhost:8091/api/messages';

  constructor(private http: HttpClient) {}

  getForTask(taskId: number): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.baseUrl}/task/${taskId}`);
  }

  send(payload: Partial<MessageDto>): Observable<MessageDto> {
    if (!payload.taskId) throw new Error('taskId required');
    return this.http.post<MessageDto>(`${this.baseUrl}/task/${payload.taskId}`, payload);
  }
}
