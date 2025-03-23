import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-visitantes',
  imports: [],
  templateUrl: './visitantes.component.html',
  styleUrl: './visitantes.component.css'
})
export class VisitantesComponent {
  constructor(private router: Router) {}
          navigateTo(path: string) {
            this.router.navigate([path]);
          }
}
