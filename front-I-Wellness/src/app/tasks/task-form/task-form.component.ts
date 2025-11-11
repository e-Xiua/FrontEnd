import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskDto } from '../../tasks/models/task.model';
import { TaskService } from '../../tasks/services/task.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatButtonModule],
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
      dueDate: [this.initial?.dueDate || ''],
      status: [this.initial?.status || 'PENDING'],
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
          dueDate: t.dueDate,
          status: t.status,
        });
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    const value = this.form.value as TaskDto;
    if (this.isEditing && this.initial?.id) {
      this.taskService.update(this.initial.id, value).subscribe(() => this.router.navigate(['/tasks']));
    } else {
      this.taskService.create(value).subscribe(() => this.router.navigate(['/tasks']));
    }
  }
}
