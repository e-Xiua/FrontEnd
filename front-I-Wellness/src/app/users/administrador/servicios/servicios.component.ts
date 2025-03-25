import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-servicios',
  imports: [],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.css'
})
export class ServiciosComponent {
  constructor(private router: Router) {}
          navigateTo(path: string) {
            this.router.navigate([path]);
          }
}
