import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
}

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.css']
})
export class TaskDashboardComponent {
  tasks: Task[] = [
    { id: 1, title: 'Diseñar wireframes', description: 'Pantallas principales del módulo', status: 'todo', tags: ['Diseño'] },
    { id: 2, title: 'Configurar backend', description: 'Endpoints para tareas y notificaciones', status: 'inprogress', tags: ['Backend'] },
    { id: 3, title: 'Probar integración', description: 'Validar notificaciones y guardado', status: 'done', tags: ['QA'] },
  ];

  newTaskTitle = '';
  newTaskDescription = '';

  // Filtrado por estado
  getTasksByStatus(status: 'todo' | 'inprogress' | 'done'): Task[] {
    return this.tasks.filter(task => task.status === status);
  }

  // Crear nueva tarea
  addTask() {
    if (!this.newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      title: this.newTaskTitle,
      description: this.newTaskDescription,
      status: 'todo',
    };
    this.tasks.push(newTask);
    this.newTaskTitle = '';
    this.newTaskDescription = '';
  }

  // Cambiar estado (arrastrar o clic)
  moveTask(task: Task, newStatus: 'todo' | 'inprogress' | 'done') {
    task.status = newStatus;
  }

  // Eliminar tarea
  deleteTask(task: Task) {
    this.tasks = this.tasks.filter(t => t.id !== task.id);
  }
}
