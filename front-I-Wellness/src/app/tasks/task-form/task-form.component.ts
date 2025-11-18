import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskDto } from '../models/task.model';
import { TaskService } from '../services/task.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent implements OnInit {
  @Input() isEditing = false;
  @Input() initial?: TaskDto;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // initialize form
    this.form = this.fb.group({
      title: [this.initial?.title || '', Validators.required],
      description: [this.initial?.description || ''],
      responsibleName: [this.initial?.responsibleName || ''],
      project: [this.initial?.project || ''],
      priority: [this.initial?.priority || 'MEDIUM'],
      progress: [this.initial?.progress || 0],
      dueDate: [this.initial?.dueDate || ''],
      status: [this.initial?.status || 'TODO'],
    });

    // If route contains an id param, load it for editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const taskId = Number(id);
      this.taskService.getById(taskId).subscribe((t) => {
        this.initial = t as TaskDto;
        this.isEditing = true;
        this.form.patchValue({
          title: t.title,
          description: t.description,
          responsibleName: t.responsibleName,
          project: t.project,
          priority: t.priority || 'MEDIUM',
          progress: t.progress || 0,
          dueDate: t.dueDate,
          status: t.status,
        });
      });
    }
  }

  submit() {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Formulario inválido',
        text: 'Por favor completa todos los campos requeridos.',
        confirmButtonColor: '#4a9c9f'
      });
      return;
    }

    const value = this.form.value as TaskDto;
    
    if (this.isEditing && this.initial?.id) {
      this.taskService.update(this.initial.id, value).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Tarea actualizada',
            text: 'La tarea ha sido actualizada correctamente.',
            confirmButtonColor: '#4a9c9f'
          });
          this.router.navigate(['/tasks']);
        },
        error: (err) => {
          console.error('Error al actualizar tarea:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la tarea. Intenta nuevamente.',
            confirmButtonColor: '#4a9c9f'
          });
        }
      });
    } else {
      this.taskService.create(value).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Tarea creada',
            text: 'La tarea ha sido creada correctamente.',
            confirmButtonColor: '#4a9c9f'
          });
          this.router.navigate(['/tasks']);
        },
        error: (err) => {
          console.error('Error al crear tarea:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la tarea. Intenta nuevamente.',
            confirmButtonColor: '#4a9c9f'
          });
        }
      });
    }
  }
}
