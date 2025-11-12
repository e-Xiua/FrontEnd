import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskDto, TaskDetailDto, TaskKpiDto } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly baseUrl = 'http://localhost:8091/api/tasks';
  
  constructor(private http: HttpClient) {}

  getAll(): Observable<TaskDto[]> {
    return this.http.get<TaskDto[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<TaskDetailDto> {
    return this.http.get<TaskDetailDto>(`${this.baseUrl}/${id}/detail`);
  }

  getKpis(): Observable<TaskKpiDto> {
    return this.http.get<TaskKpiDto>(`${this.baseUrl}/kpis`);
  }

  create(task: TaskDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(this.baseUrl, task);
  }

  update(id: number, task: TaskDto): Observable<TaskDto> {
    return this.http.put<TaskDto>(`${this.baseUrl}/${id}`, task);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
