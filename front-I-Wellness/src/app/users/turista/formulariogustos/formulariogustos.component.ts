import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-formulariogustos',
  imports: [CommonModule],
  templateUrl: './formulariogustos.component.html',
  styleUrl: './formulariogustos.component.css'
})
export class FormulariogustosComponent {

  gustos: any[] = [
    { nombre: 'Sauna', imagen: 'https://q-xx.bstatic.com/xdata/images/hotel/max500/626904491.jpg?k=dbff1e084c2382e12f4fe2da94a92536985afe63651db5dcf78beb0e74edb051&o=' },
    { nombre: 'Senderismo', imagen: 'https://www.revistaviajesdigital.com/images/Trekking-Caminata-Arenal-1968-5.jpg' },
    { nombre: 'Balneario', imagen: 'https://mytanfeet.com/wp-content/uploads/2023/06/la-fortuna-hot-springs-the-springs-resort-and-spa.jpg' },
    { nombre: 'Yoga', imagen: 'https://photos.tpn.to/qp/qj/pr/oi/299x225.jpg' },
    { nombre: 'Meditación', imagen: 'https://cdn.forbes.com.mx/2021/05/Foto-A7-Turismo-Wellness.jpg'},
    { nombre: 'Masajes', imagen: 'https://arenalmanoa.com/wp-content/uploads/2023/04/arenal-costa-rica-spa-resort.jpg'}
  ];

  seleccionados: any[] = [];

  seleccionarGusto(item: any) {
    const index = this.seleccionados.indexOf(item);
    if (index > -1) {
      this.seleccionados.splice(index, 1); // Si ya está seleccionado, se deselecciona
    } else if (this.seleccionados.length < 5) {
      this.seleccionados.push(item); // Agregar a seleccionados si hay espacio
    }
  }
  constructor(private router: Router) {}

  continuar() {
    if (this.seleccionados.length >= 3) {
      console.log('Seleccionados:', this.seleccionados);
      this.router.navigate(['/hometurista']);
    } else {
      alert('Debes seleccionar entre 3 y 5 opciones.');
    }
  }

}
