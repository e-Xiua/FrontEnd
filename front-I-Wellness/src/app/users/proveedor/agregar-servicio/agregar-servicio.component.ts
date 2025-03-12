import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agregar-servicio',
  imports: [],
  templateUrl: './agregar-servicio.component.html',
  styleUrl: './agregar-servicio.component.css'
})
export class AgregarServicioComponent {
  constructor(private router: Router) {}
        navigateTo(path: string) {
          this.router.navigate([path]);
        }

}
