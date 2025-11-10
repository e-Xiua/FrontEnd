import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-objetivos-admin',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, FormsModule],
  templateUrl: './objetivos-admin.component.html',
  styleUrls: ['./objetivos-admin.component.css']
})
export class ObjetivosAdminComponent {
  objetivos = [
    { nombre: 'Visitas mensuales al sistema', meta: 100, actual: 45, descripcion: 'Cantidad de visitas al sistema este mes.', icon: 'icon-visitas', grafica: [
      { name: '01', value: 2 }, { name: '02', value: 3 }, { name: '03', value: 1 }, { name: '04', value: 4 }, { name: '05', value: 2 }, { name: '06', value: 1 }, { name: '07', value: 0 }, { name: '08', value: 1 }
    ] },
    { nombre: 'Usuarios registrados', meta: 50, actual: 30, descripcion: 'Usuarios nuevos registrados en el sistema.', icon: 'icon-usuarios', grafica: [
      { name: '01', value: 1 }, { name: '02', value: 0 }, { name: '03', value: 2 }, { name: '04', value: 1 }, { name: '05', value: 1 }, { name: '06', value: 0 }, { name: '07', value: 1 }
    ] },
    { nombre: 'Eventos realizados', meta: 10, actual: 3, descripcion: 'Eventos organizados y gestionados en la plataforma.', icon: 'icon-eventos' },
    { nombre: 'Tareas completadas', meta: 20, actual: 12, descripcion: 'Tareas administrativas completadas.', icon: 'icon-tareas' },
    { nombre: 'Empresas registradas', meta: 15, actual: 8, descripcion: 'Empresas turísticas registradas.', icon: 'icon-empresas' },
    { nombre: 'Servicios activos', meta: 30, actual: 18, descripcion: 'Servicios turísticos activos en el sistema.', icon: 'icon-servicios' },
    { nombre: 'Reservas totales', meta: 60, actual: 25, descripcion: 'Reservas realizadas por los usuarios.', icon: 'icon-reservas' },
    { nombre: 'Tasa de conversión', meta: 80, actual: 65, descripcion: 'Porcentaje de usuarios que completan una acción relevante.', icon: 'icon-conversion' },
    { nombre: 'Cancelaciones', meta: 5, actual: 2, descripcion: 'Reservas canceladas este mes.', icon: 'icon-cancelaciones' },
    { nombre: 'Interacción en eventos', meta: 100, actual: 70, descripcion: 'Participaciones en eventos realizados.', icon: 'icon-interaccion' }
  ];

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

  getGraficaWidth(min: number, obj: any): number {
    return obj && obj.grafica ? Math.max(min, obj.grafica.length * (min/10)) : min;
  }
}
