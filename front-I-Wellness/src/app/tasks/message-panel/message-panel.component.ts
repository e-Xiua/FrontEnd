import { Component, Input, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, interval, Subject, switchMap, startWith, takeUntil } from 'rxjs';
import { MessageDto } from '../models/task.model';
import { MessageService } from '../services/message.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './message-panel.component.html',
  styleUrls: ['./message-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagePanelComponent implements OnInit, OnDestroy {
  @Input() taskId!: number | undefined;
  messages$!: Observable<MessageDto[]>;
  form!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private msgService: MessageService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({ content: ['', Validators.required] });
    if (this.taskId) {
      // Poll backend every 3 seconds; start immediately
      this.messages$ = interval(3000).pipe(
        startWith(0),
        switchMap(() => this.msgService.getForTask(this.taskId!)),
        takeUntil(this.destroy$)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  send() {
    if (!this.taskId || this.form.invalid) return;
    
    // Obtener el ID del usuario actual del localStorage o contexto
    const currentUserId = localStorage.getItem('userId') || localStorage.getItem('idUsuario') || 'anonymous';
    
    const payload: Partial<MessageDto> = {
      taskId: this.taskId,
      senderId: currentUserId,
      content: this.form.value.content,
    };
    
    this.msgService.send(payload).subscribe({
      next: () => {
        this.form.reset();
        // polling will fetch the new message shortly
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);
      }
    });
  }
}
