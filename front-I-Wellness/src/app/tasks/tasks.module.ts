import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { MessagePanelComponent } from './message-panel/message-panel.component';
import { RouterModule } from '@angular/router';
import { TasksRoutingModule } from './tasks-routing.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    DragDropModule,
    TaskListComponent,
    TaskDetailComponent,
    TaskFormComponent,
    MessagePanelComponent,
    TasksRoutingModule
  ]
})
export class TasksModule {}
