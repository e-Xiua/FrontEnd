import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, takeUntil } from 'rxjs';
import { UniversalHeaderComponent } from '../../shared/components/universal-header/universal-header.component';
import { Evento, EventoForm } from '../../shared/models/evento';
import { EventoApiService } from './services/evento-api.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  events: Evento[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatMenuModule,
    UniversalHeaderComponent
  ],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css']
})
export class CalendarioComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  calendarDays: CalendarDay[] = [];
  eventos: Evento[] = [];

  isLoading = false;
  loadError: string | null = null;
  isSaving = false;
  
  eventoForm: FormGroup;
  showEventForm = false;
  showEventTypeSelector = false;
  showEventDetail = false;
  selectedDate: Date | null = null;
  selectedEvent: Evento | null = null;
  selectedEventType: 'evento' | 'reunion' = 'evento';
  showYearSelector = false;
  showMonthSelector = false;
  isEditing = false;

  availableYears: number[] = [];
  availableMonths = this.monthNames;

  constructor(
    private readonly fb: FormBuilder,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
    private readonly eventoApi: EventoApiService
  ) {
    this.eventoForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      duracion: [60, [Validators.required, Validators.min(15)]],
      costo: [0],
      asistentes: ['']
    });

    this.generateAvailableYears();
  }

  ngOnInit() {
    this.generateCalendar();
    this.loadEventos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generateAvailableYears() {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      this.availableYears.push(year);
    }
  }

  private loadEventos(): void {
    this.isLoading = true;
    this.loadError = null;

    this.eventoApi.getEventos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (eventos) => {
          this.isLoading = false;
          const formattedEventos = eventos
            .map((evento) => ({
              ...evento,
              color: evento.color || this.getColorForType(evento.tipo)
            }))
            .filter(evento => evento.activo !== false);

          this.eventos = formattedEventos
            .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
          this.generateCalendar();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar los eventos', error);
          this.isLoading = false;
          this.loadError = 'No se pudieron cargar los eventos';
          this.generateCalendar();
          this.snackBar.open('No se pudieron cargar los eventos', 'Cerrar', {
            duration: 3000,
            panelClass: 'snackbar-error'
          });
          this.cdr.detectChanges();
        }
      });
  }

  generateCalendar() {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === this.currentMonth;
      const isToday = this.isSameDate(date, today);
      const isPast = date < today && !isToday;
      
      const dayEvents = this.getEventsForDate(date);
      
      this.calendarDays.push({
        date,
        isCurrentMonth,
        isToday,
        isPast,
        events: dayEvents
      });
    }
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  previousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  previousYear() {
    this.currentYear--;
    this.generateCalendar();
  }

  nextYear() {
    this.currentYear++;
    this.generateCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.generateCalendar();
  }

  selectYear(year: number) {
    this.currentYear = year;
    this.showYearSelector = false;
    this.generateCalendar();
  }

  selectMonth(monthIndex: number) {
    this.currentMonth = monthIndex;
    this.showMonthSelector = false;
    this.generateCalendar();
  }

  getEventsForDate(date: Date): Evento[] {
    return this.eventos.filter(evento => {
      const eventoDate = evento.fecha instanceof Date ? evento.fecha : new Date(evento.fecha);
      return this.isSameDate(eventoDate, date);
    });
  }

  onDayClick(day: CalendarDay, event: Event) {
    const target = event.target as HTMLElement;
    const isEventClick = target.closest('.event-item');
    
    if (isEventClick) {
      return;
    }
    
    this.selectedDate = day.date;
    this.showEventTypeSelector = true;
    this.cdr.detectChanges();
  }

  onEventClick(evento: Evento, event: Event) {
    event.stopPropagation();
    this.selectedEvent = evento;
    this.showEventDetail = true;
    this.cdr.detectChanges();
  }

  openEventForm(date: Date, eventType: 'evento' | 'reunion') {
    this.selectedDate = date;
    this.selectedEventType = eventType;
    this.showEventForm = true;
    this.showEventTypeSelector = false;
    
    const fechaStr = date.toISOString().split('T')[0];
    this.eventoForm.patchValue({
      fecha: fechaStr,
      hora: '09:00',
      costo: eventType === 'evento' ? 0 : undefined
    });
  }

  openEventFormForEdit(evento: Evento) {
    this.selectedEvent = evento;
    this.selectedEventType = evento.tipo;
    this.isEditing = true;
    this.showEventDetail = false;
    this.showEventForm = true;
    
    const eventDate = evento.fecha instanceof Date ? evento.fecha : new Date(evento.fecha);
    const fechaStr = eventDate.toISOString().split('T')[0];
    const horaStr = eventDate.toTimeString().split(' ')[0].substring(0, 5);
    
    this.eventoForm.patchValue({
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fecha: fechaStr,
      hora: horaStr,
      duracion: evento.duracion,
      costo: evento.costo,
      asistentes: evento.asistentes.join(', ')
    });
  }

  closeEventForm() {
    this.showEventForm = false;
    this.selectedDate = null;
    this.selectedEvent = null;
    this.isEditing = false;
    this.isSaving = false;
    this.eventoForm.reset();
  }

  closeEventTypeSelector() {
    this.showEventTypeSelector = false;
    this.selectedDate = null;
  }

  closeEventDetail() {
    this.showEventDetail = false;
    this.selectedEvent = null;
  }

  onSubmit() {
    if (!this.eventoForm.valid || (!this.selectedDate && !this.isEditing)) {
      return;
    }

    const formData = this.eventoForm.value as EventoForm;
    const [year, month, day] = formData.fecha.split('-').map(value => parseInt(value, 10));
    const [hours, minutes] = formData.hora.split(':').map(value => parseInt(value, 10));

    const eventDate = new Date(year, month - 1, day, hours, minutes);

    const asistentes = formData.asistentes
      ? formData.asistentes
          .split(',')
          .map(email => email.trim())
          .filter(email => email.length > 0)
      : [];

    const entityLabel = this.selectedEventType === 'evento' ? 'Evento' : 'Reunión';
    const entityLowerLabel = this.selectedEventType === 'evento' ? 'evento' : 'reunión';
    const entityArticle = this.selectedEventType === 'evento' ? 'el' : 'la';

    const baseEvent: Evento = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      fecha: eventDate,
      duracion: formData.duracion,
      costo: formData.costo || 0,
      asistentes,
      tipo: this.selectedEventType,
      color: this.getColorForType(this.selectedEventType),
      activo: this.selectedEvent?.activo ?? true
    };

    this.isSaving = true;

    if (this.isEditing) {
      if (!this.selectedEvent?.id) {
        this.isSaving = false;
        this.snackBar.open('No se pudo identificar el evento a actualizar', 'Cerrar', {
          duration: 3000,
          panelClass: 'snackbar-error'
        });
        return;
      }

      const patchPayload = this.buildPatchPayload(this.selectedEvent, baseEvent, this.selectedEventType);

      if (Object.keys(patchPayload).length === 0) {
        this.isSaving = false;
        this.snackBar.open('No se detectaron cambios para actualizar', 'Cerrar', {
          duration: 3000,
          panelClass: 'snackbar-success'
        });
        return;
      }

      this.eventoApi.patchEvento(this.selectedEvent.id, patchPayload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (eventoActualizado) => {
            this.isSaving = false;
            const index = this.eventos.findIndex(e => e.id === eventoActualizado.id);
            if (index !== -1) {
              this.eventos[index] = eventoActualizado;
            } else {
              this.eventos.push(eventoActualizado);
            }
            this.eventos = this.eventos
              .filter(evento => evento.activo !== false)
              .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
            this.snackBar.open(`${entityLabel} actualizado exitosamente`, 'Cerrar', {
              duration: 3000,
              panelClass: 'snackbar-success'
            });
            this.closeEventForm();
            this.generateCalendar();
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error al actualizar el evento', error);
            this.isSaving = false;
            this.snackBar.open(`No se pudo actualizar ${entityArticle} ${entityLowerLabel}`, 'Cerrar', {
              duration: 3000,
              panelClass: 'snackbar-error'
            });
          }
        });
    } else {
      const newEvent: Evento = {
        ...baseEvent
      };

      this.eventoApi.createEvento(newEvent)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (eventoCreado) => {
            this.isSaving = false;
            this.eventos.push(eventoCreado);
            this.eventos = this.eventos
              .filter(evento => evento.activo !== false)
              .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
            this.snackBar.open(`${entityLabel} creado exitosamente`, 'Cerrar', {
              duration: 3000,
              panelClass: 'snackbar-success'
            });
            this.closeEventForm();
            this.generateCalendar();
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error al crear el evento', error);
            this.isSaving = false;
            this.snackBar.open(`No se pudo crear ${entityArticle} ${entityLowerLabel}`, 'Cerrar', {
              duration: 3000,
              panelClass: 'snackbar-error'
            });
          }
        });
    }
  }

  deleteEvent(eventId?: string, onSuccess?: () => void) {
    if (!eventId) {
      this.snackBar.open('No se pudo identificar el evento a eliminar', 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-error'
      });
      return;
    }

    this.eventoApi.patchEvento(eventId, { activo: false })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.eventos = this.eventos.filter(evento => evento.id !== eventId);
          this.generateCalendar();
          this.snackBar.open('Evento marcado como eliminado', 'Cerrar', {
            duration: 2000,
            panelClass: 'snackbar-success'
          });
          if (onSuccess) {
            onSuccess();
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al eliminar el evento', error);
          this.snackBar.open('No se pudo eliminar el evento', 'Cerrar', {
            duration: 3000,
            panelClass: 'snackbar-error'
          });
        }
      });
  }

  deleteEventFromDetail() {
    if (this.selectedEvent?.id) {
      const eventId = this.selectedEvent.id;
      this.deleteEvent(eventId, () => this.closeEventDetail());
    }
  }

  getMonthYearString(): string {
    return `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }

  createNewEvent() {
    this.openEventForm(new Date(), 'evento');
  }

  createNewMeeting() {
    this.openEventForm(new Date(), 'reunion');
  }

  toggleYearSelector() {
    this.showYearSelector = !this.showYearSelector;
    this.showMonthSelector = false;
  }

  toggleMonthSelector() {
    this.showMonthSelector = !this.showMonthSelector;
    this.showYearSelector = false;
  }

  private getColorForType(tipo: 'evento' | 'reunion'): string {
    return tipo === 'reunion' ? '#2196F3' : '#4CAF50';
  }

  private buildPatchPayload(original: Evento, updated: Evento, updatedType: 'evento' | 'reunion'): Partial<Evento> {
    const patch: Partial<Evento> = {};

    if (original.titulo !== updated.titulo) {
      patch.titulo = updated.titulo;
    }

    if (original.descripcion !== updated.descripcion) {
      patch.descripcion = updated.descripcion;
    }

    const originalDate = original.fecha instanceof Date ? original.fecha : new Date(original.fecha);
    if (!isNaN(originalDate.getTime()) && originalDate.getTime() !== updated.fecha.getTime()) {
      patch.fecha = updated.fecha;
    }

    if (original.duracion !== updated.duracion) {
      patch.duracion = updated.duracion;
    }

    const originalCosto = original.costo ?? 0;
    const updatedCosto = updated.costo ?? 0;
    if (originalCosto !== updatedCosto) {
      patch.costo = updatedCosto;
    }

    const originalAsistentes = this.normalizeEmails(original.asistentes);
    const updatedAsistentes = this.normalizeEmails(updated.asistentes);
    if (!this.arraysEqual(originalAsistentes, updatedAsistentes)) {
      patch.asistentes = updatedAsistentes;
    }

    if (original.tipo !== updatedType) {
      patch.tipo = updatedType;
      patch.color = updated.color;
    } else if (original.color !== updated.color) {
      patch.color = updated.color;
    }

    return patch;
  }

  private normalizeEmails(emails?: string[]): string[] {
    return (emails ?? [])
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  private arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => value === b[index]);
  }

  getEventSummary(): string {
    const totalEvents = this.eventos.length;
    const currentMonthEvents = this.eventos.filter(evento => {
      const eventoDate = evento.fecha instanceof Date ? evento.fecha : new Date(evento.fecha);
      return eventoDate.getMonth() === this.currentMonth && 
             eventoDate.getFullYear() === this.currentYear;
    }).length;
    
    return `${currentMonthEvents} eventos este mes (${totalEvents} total)`;
  }

}
