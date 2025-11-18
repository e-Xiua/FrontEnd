import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule, ParamMap } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { TaskDetailDto, TaskPriority, TaskStatus } from '../models/task.model';
import { TaskService } from '../services/task.service';
import { MessagePanelComponent } from '../message-panel/message-panel.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MessagePanelComponent],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit {
  task$!: Observable<TaskDetailDto>;

  constructor(
    private route: ActivatedRoute, 
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.task$ = this.route.paramMap.pipe(
      switchMap((pm: ParamMap) => this.taskService.getById(Number(pm.get('id'))))
    );
  }

  getPriorityLabel(priority?: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      'LOW': 'Baja',
      'MEDIUM': 'Media',
      'HIGH': 'Alta',
      'URGENT': 'Urgente'
    };
    return priority ? labels[priority] : 'Media';
  }

  getStatusLabel(status?: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      'TODO': 'Por Hacer',
      'IN_PROGRESS': 'En Progreso',
      'DONE': 'Completada',
      'CANCELLED': 'Cancelada'
    };
    return status ? labels[status] : 'Por Hacer';
  }

  getStatusIcon(status?: TaskStatus): string {
    const icons: Record<TaskStatus, string> = {
      'TODO': 'fas fa-clipboard-list',
      'IN_PROGRESS': 'fas fa-spinner',
      'DONE': 'fas fa-check-circle',
      'CANCELLED': 'fas fa-times-circle'
    };
    return status ? icons[status] : 'fas fa-clipboard-list';
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  changeStatus(task: TaskDetailDto, newStatus: TaskStatus) {
    if (!task.id) return;

    const statusLabels = {
      'TODO': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'DONE': 'Completada',
      'CANCELLED': 'Cancelada'
    };

    Swal.fire({
      title: '¿Cambiar estado?',
      text: `¿Deseas cambiar el estado a "${statusLabels[newStatus]}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4a9c9f',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && task.id) {
        const updatedTask = { ...task, status: newStatus };
        
        // Si el estado es DONE, establecer progreso a 100%
        if (newStatus === 'DONE') {
          updatedTask.progress = 100;
        }
        // Si el estado es TODO, establecer progreso a 0%
        else if (newStatus === 'TODO') {
          updatedTask.progress = 0;
        }
        // Si el estado es IN_PROGRESS y el progreso es 0, establecer a 10%
        else if (newStatus === 'IN_PROGRESS' && (updatedTask.progress === 0 || !updatedTask.progress)) {
          updatedTask.progress = 10;
        }
        
        this.taskService.update(task.id, updatedTask).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Estado actualizado',
              text: `La tarea ahora está "${statusLabels[newStatus]}"`,
              confirmButtonColor: '#4a9c9f'
            });
            // Reload task
            this.task$ = this.taskService.getById(task.id!);
          },
          error: (err) => {
            console.error('Error al actualizar estado:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar el estado. Intenta nuevamente.',
              confirmButtonColor: '#4a9c9f'
            });
          }
        });
      }
    });
  }

  deleteTask(task: TaskDetailDto) {
    if (!task.id) return;

    Swal.fire({
      title: '¿Eliminar tarea?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && task.id) {
        this.taskService.delete(task.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Tarea eliminada',
              text: 'La tarea ha sido eliminada correctamente',
              confirmButtonColor: '#4a9c9f'
            });
            this.router.navigate(['/tasks']);
          },
          error: (err) => {
            console.error('Error al eliminar tarea:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la tarea. Intenta nuevamente.',
              confirmButtonColor: '#4a9c9f'
            });
          }
        });
      }
    });
  }
}
