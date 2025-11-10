import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskDto, TaskDetailDto } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private base = '/api/tasks';
  constructor(private http: HttpClient) {}

  getAll(): Observable<TaskDto[]> {
    return this.http.get<TaskDto[]>(this.base);
  }

  getById(id: number): Observable<TaskDetailDto> {
    return this.http.get<TaskDetailDto>(`${this.base}/${id}`);
  }

  create(task: TaskDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(this.base, task);
  }

  update(id: number, task: TaskDto): Observable<TaskDto> {
    return this.http.put<TaskDto>(`${this.base}/${id}`, task);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
