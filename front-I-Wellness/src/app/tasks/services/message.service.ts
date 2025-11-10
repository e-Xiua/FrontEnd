import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageDto } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private base = '/api/messages';
  constructor(private http: HttpClient) {}

  getForTask(taskId: number): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.base}?taskId=${taskId}`);
  }

  send(message: Partial<MessageDto>): Observable<MessageDto> {
    return this.http.post<MessageDto>(this.base, message);
  }
}
