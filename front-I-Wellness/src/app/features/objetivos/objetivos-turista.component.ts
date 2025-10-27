import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-objetivos-turista',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, FormsModule],
  templateUrl: './objetivos-turista.component.html',
  styleUrls: ['./objetivos-turista.component.css']
})
export class ObjetivosTuristaComponent {
  modoEdicion = false;
  objetivoEditando: any = null;
  nuevoObjetivo = { nombre: '', meta: 0, actual: 0, descripcion: '', icon: '' };

  iniciarCreacion() {
    this.modoEdicion = true;
    this.objetivoEditando = null;
    this.nuevoObjetivo = { nombre: '', meta: 0, actual: 0, descripcion: '', icon: '' };
  }

  iniciarEdicion(obj: any) {
    this.modoEdicion = true;
    this.objetivoEditando = obj;
    this.nuevoObjetivo = { ...obj };
  }

  guardarObjetivo() {
    if (this.objetivoEditando) {
      Object.assign(this.objetivoEditando, this.nuevoObjetivo);
    } else {
      this.objetivos.push({ ...this.nuevoObjetivo });
    }
    this.modoEdicion = false;
    this.objetivoEditando = null;
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.objetivoEditando = null;
  }
  objetivos = [
    { nombre: 'Visitas al mes', meta: 5, actual: 2, descripcion: 'Cantidad de veces que has visitado destinos este mes.', icon: 'icon-visitas', grafica: [
      { name: '01', value: 0 }, { name: '02', value: 1 }, { name: '03', value: 0 }, { name: '04', value: 1 }, { name: '05', value: 0 }, { name: '06', value: 0 }, { name: '07', value: 0 }, { name: '08', value: 0 }
    ] },
    { nombre: 'Rutas realizadas', meta: 3, actual: 1, descripcion: 'Rutas turísticas completadas en el sistema.', icon: 'icon-rutas' },
    { nombre: 'Reservas realizadas', meta: 4, actual: 2, descripcion: 'Reservas de servicios turísticos hechas este mes.', icon: 'icon-reservas', grafica: [
      { name: '01', value: 0 }, { name: '02', value: 1 }, { name: '03', value: 1 }, { name: '04', value: 0 }
    ] },
    { nombre: 'Servicios favoritos', meta: 5, actual: 3, descripcion: 'Servicios marcados como favoritos.', icon: 'icon-favoritos' },
    { nombre: 'Reseñas publicadas', meta: 2, actual: 1, descripcion: 'Reseñas escritas sobre servicios visitados.', icon: 'icon-reseñas' },
    { nombre: 'Preferencias actualizadas', meta: 1, actual: 1, descripcion: 'Preferencias de viaje actualizadas.', icon: 'icon-preferencias' }
  ];

  getGraficaWidth(min: number, obj: any): number {
    return obj && obj.grafica ? Math.max(min, obj.grafica.length * (min/10)) : min;
  }
}
