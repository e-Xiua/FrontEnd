  // ...existing code...
import { Component } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-objetivos-proveedor',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, FormsModule],
  templateUrl: './objetivos-proveedor.component.html',
  styleUrls: ['./objetivos-proveedor.component.css']
})
export class ObjetivosProveedorComponent {
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
      this.objetivosGenerales.push({ ...this.nuevoObjetivo });
    }
    this.modoEdicion = false;
    this.objetivoEditando = null;
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.objetivoEditando = null;
  }
  getGraficaWidth(min: number, obj: any): number {
    return obj && obj.grafica ? Math.max(min, obj.grafica.length * (min/10)) : min;
  }
  objetivosGenerales = [
    { nombre: 'Visitantes por mes', meta: 20, actual: 8, descripcion: 'Cantidad de turistas que han visitado tus servicios este mes.', icon: 'icon-visitas', grafica: [
      { name: '01', value: 1 }, { name: '02', value: 0 }, { name: '03', value: 2 }, { name: '04', value: 1 }, { name: '05', value: 0 }, { name: '06', value: 1 }, { name: '07', value: 1 }, { name: '08', value: 2 }
    ] },
    { nombre: 'Puntaje de reseñas', meta: 4.5, actual: 4.0, descripcion: 'Promedio de calificación que debes alcanzar en tus servicios.', icon: 'icon-reseñas' },
    { nombre: 'Servicios activos', meta: 5, actual: 3, descripcion: 'Servicios turísticos activos en el sistema.', icon: 'icon-servicios' },
    { nombre: 'Reservas confirmadas', meta: 10, actual: 6, descripcion: 'Reservas confirmadas en tus servicios este mes.', icon: 'icon-reservas', grafica: [
      { name: '01', value: 0 }, { name: '02', value: 1 }, { name: '03', value: 1 }, { name: '04', value: 0 }, { name: '05', value: 2 }, { name: '06', value: 1 }, { name: '07', value: 1 }
    ] },
    { nombre: 'Servicios nuevos', meta: 3, actual: 2, descripcion: 'Servicios turísticos creados este mes.', icon: 'icon-nuevos' },
    { nombre: 'Cancelaciones', meta: 2, actual: 1, descripcion: 'Reservas canceladas en tus servicios.', icon: 'icon-cancelaciones' },
    { nombre: 'Interacción con turistas', meta: 15, actual: 10, descripcion: 'Mensajes o reseñas recibidas de turistas.', icon: 'icon-interaccion' }
  ];

  servicios = [
    {
      nombre: 'Tour Volcán',
      imagen: 'assets/Arenal-la-fortuna.jpg',
      objetivos: [
        { nombre: 'Reservas este mes', meta: 5, actual: 2, descripcion: 'Reservas realizadas para este servicio.', grafica: [
          { name: '01', value: 0 }, { name: '02', value: 1 }, { name: '03', value: 0 }, { name: '04', value: 1 }
        ] },
        { nombre: 'Puntaje reseñas', meta: 4.8, actual: 4.5, descripcion: 'Promedio de reseñas para este servicio.' }
      ]
    },
    {
      nombre: 'Rafting Río',
      imagen: 'assets/service-test.jpg',
      objetivos: [
        { nombre: 'Reservas este mes', meta: 8, actual: 4, descripcion: 'Reservas realizadas para este servicio.', grafica: [
          { name: '01', value: 1 }, { name: '02', value: 0 }, { name: '03', value: 2 }, { name: '04', value: 1 }
        ] },
        { nombre: 'Puntaje reseñas', meta: 4.7, actual: 4.2, descripcion: 'Promedio de reseñas para este servicio.' }
      ]
    }
  ];
}
