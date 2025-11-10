import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageDto } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  // Keep messages under task resource for consistency
  private base = '/api/tasks';

  constructor(private http: HttpClient) {}

  getForTask(taskId: number): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.base}/${taskId}/messages`);
  }

  send(payload: Partial<MessageDto>): Observable<MessageDto> {
    if (!payload.taskId) throw new Error('taskId required');
    return this.http.post<MessageDto>(`${this.base}/${payload.taskId}/messages`, payload as any);
  }
}
