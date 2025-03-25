import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-turista',
  imports: [],
  templateUrl: './registro-turista.component.html',
  styleUrl: './registro-turista.component.css'
})
export class RegistroTuristaComponent {

  //Va hacia formulario gustos
  constructor(private router: Router) {}
    navigateTo(path: string) {
      this.router.navigate([path]);
    }

}
