import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { Evento, EventoForm } from '../../shared/models/evento';

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
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatMenuModule
  ],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css']
})
export class CalendarioComponent implements OnInit {
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
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
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
    this.addSampleEvents();
    this.generateCalendar();
  }

  addSampleEvents() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sampleEvent: Evento = {
      id: '1',
      titulo: 'Evento de Prueba',
      descripcion: 'Este es un evento de prueba para verificar la funcionalidad',
      fecha: tomorrow,
      duracion: 60,
      costo: 50,
      asistentes: ['test@ejemplo.com'],
      tipo: 'evento',
      color: '#4CAF50'
    };
    
    const sampleMeeting: Evento = {
      id: '2',
      titulo: 'Reunión de Equipo',
      descripcion: 'Reunión semanal del equipo de desarrollo',
      fecha: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      duracion: 90,
      costo: 0,
      asistentes: ['dev1@ejemplo.com', 'dev2@ejemplo.com'],
      tipo: 'reunion',
      color: '#2196F3'
    };
    
    this.eventos.push(sampleEvent, sampleMeeting);
  }

  generateAvailableYears() {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      this.availableYears.push(year);
    }
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
      const eventoDate = new Date(evento.fecha);
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
    
    const fechaStr = evento.fecha.toISOString().split('T')[0];
    const horaStr = evento.fecha.toTimeString().split(' ')[0].substring(0, 5);
    
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
    if (this.eventoForm.valid && (this.selectedDate || this.isEditing)) {
      const formData = this.eventoForm.value as EventoForm;
      const [year, month, day] = formData.fecha.split('-');
      const [hours, minutes] = formData.hora.split(':');
      
      const eventDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      const asistentes = formData.asistentes
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (this.isEditing && this.selectedEvent) {
        const eventIndex = this.eventos.findIndex(e => e.id === this.selectedEvent!.id);
        if (eventIndex !== -1) {
          this.eventos[eventIndex] = {
            ...this.eventos[eventIndex],
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            fecha: eventDate,
            duracion: formData.duracion,
            costo: formData.costo || 0,
            asistentes: asistentes,
            tipo: this.selectedEventType,
            color: this.selectedEventType === 'evento' ? '#4CAF50' : '#2196F3'
          };
        }
        
        this.snackBar.open(
          `${this.selectedEventType === 'evento' ? 'Evento' : 'Reunión'} actualizado exitosamente`,
          'Cerrar',
          { duration: 3000, panelClass: 'snackbar-success' }
        );
      } else {
        const newEvent: Evento = {
          id: Date.now().toString(),
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          fecha: eventDate,
          duracion: formData.duracion,
          costo: formData.costo || 0,
          asistentes: asistentes,
          tipo: this.selectedEventType,
          color: this.selectedEventType === 'evento' ? '#4CAF50' : '#2196F3'
        };

        this.eventos.push(newEvent);
        
        this.snackBar.open(
          `${this.selectedEventType === 'evento' ? 'Evento' : 'Reunión'} creado exitosamente`,
          'Cerrar',
          { duration: 3000, panelClass: 'snackbar-success' }
        );
      }
      
      this.eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
      this.closeEventForm();
      this.generateCalendar();
    }
  }

  deleteEvent(eventId: string) {
    this.eventos = this.eventos.filter(evento => evento.id !== eventId);
    this.snackBar.open('Evento eliminado', 'Cerrar', { duration: 2000 });
    this.generateCalendar();
  }

  deleteEventFromDetail() {
    if (this.selectedEvent) {
      this.deleteEvent(this.selectedEvent.id);
      this.closeEventDetail();
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

  getEventSummary(): string {
    const totalEvents = this.eventos.length;
    const currentMonthEvents = this.eventos.filter(evento => {
      const eventoDate = new Date(evento.fecha);
      return eventoDate.getMonth() === this.currentMonth && 
             eventoDate.getFullYear() === this.currentYear;
    }).length;
    
    return `${currentMonthEvents} eventos este mes (${totalEvents} total)`;
  }

}