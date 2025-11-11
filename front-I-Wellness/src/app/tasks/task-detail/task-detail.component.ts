import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, ParamMap } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { TaskDetailDto } from '../../tasks/models/task.model';
import { TaskService } from '../../tasks/services/task.service';
import { MatCardModule } from '@angular/material/card';
import { MessagePanelComponent } from '../message-panel/message-panel.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MessagePanelComponent],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit {
  task$!: Observable<TaskDetailDto>;

  constructor(private route: ActivatedRoute, private taskService: TaskService) {}

  ngOnInit(): void {
  this.task$ = this.route.paramMap.pipe(switchMap((pm: ParamMap) => this.taskService.getById(Number(pm.get('id')))));
  }
}
