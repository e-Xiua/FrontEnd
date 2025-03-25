import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-turista',
  imports: [],
  templateUrl: './perfil-turista.component.html',
  styleUrl: './perfil-turista.component.css'
})
export class PerfilTuristaComponent {
   constructor(private router: Router) {}
        navigateTo(path: string) {
          this.router.navigate([path]);
        }

}
