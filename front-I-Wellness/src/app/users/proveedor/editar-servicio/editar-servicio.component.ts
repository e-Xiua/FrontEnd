import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editar-servicio',
  imports: [],
  templateUrl: './editar-servicio.component.html',
  styleUrl: './editar-servicio.component.css'
})
export class EditarServicioComponent {
  constructor(private router: Router) {}
        navigateTo(path: string) {
          this.router.navigate([path]);
        }

}
