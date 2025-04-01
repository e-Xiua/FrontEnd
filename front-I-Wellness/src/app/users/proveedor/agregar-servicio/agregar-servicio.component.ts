import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agregar-servicio',
   standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './agregar-servicio.component.html',
  styleUrl: './agregar-servicio.component.css'
})
export class AgregarServicioComponent {
   // Días de la semana disponibles
   days = [
    { name: 'Lunes', selected: false },
    { name: 'Martes', selected: false },
    { name: 'Miércoles', selected: false },
    { name: 'Jueves', selected: false },
    { name: 'Viernes', selected: false },
    { name: 'Sábado', selected: false },
    { name: 'Domingo', selected: false }
  ];

  // Horario de inicio y fin
  startTime: string = '';
  endTime: string = '';

  constructor(private router: Router) {}
  
  // Método para generar la cadena de horario estandarizada
  getFormattedSchedule(): string {
    const selectedDays = this.days
      .filter(day => day.selected)
      .map(day => day.name)
      .join(', ');

    return selectedDays && this.startTime && this.endTime
      ? `${selectedDays}: ${this.startTime} - ${this.endTime}`
      : 'Horario no seleccionado';
  }
        navigateTo(path: string) {
          this.router.navigate([path]);
        }

}
