import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskDto } from '../models/task.model';
import { TaskService } from '../services/task.service';
import { Router, RouterModule } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule, MatCardModule, MatButtonModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit, OnDestroy {
  pending: TaskDto[] = [];
  inProgress: TaskDto[] = [];
  completed: TaskDto[] = [];
  sub = new Subscription();
  @Output() select = new EventEmitter<TaskDto>();

  constructor(private taskService: TaskService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  load() {
    this.sub.add(
      this.taskService.getAll().subscribe((tasks: TaskDto[]) => {
        this.pending = tasks.filter((t: TaskDto) => t.status === 'TODO');
        this.inProgress = tasks.filter((t: TaskDto) => t.status === 'IN_PROGRESS');
        this.completed = tasks.filter((t: TaskDto) => t.status === 'DONE');
      })
    );
  }

  open(task: TaskDto) {
    this.select.emit(task);
    if (task.id) this.router.navigate(['/tasks', task.id]);
  }

  drop(event: CdkDragDrop<TaskDto[]>) {
    // same-list reorder
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const moved = event.container.data[event.currentIndex];
      if (moved?.id) {
        const newStatus = this.statusForContainer(event.container.id);
        const payload: TaskDto = { ...moved, status: newStatus } as TaskDto;
        this.taskService.update(moved.id!, payload).subscribe();
      }
    }
  }

  private statusForContainer(id: string): TaskDto['status'] {
    if (id === 'inprogress') return 'IN_PROGRESS';
    if (id === 'completed') return 'DONE';
    return 'TODO';
  }
}
