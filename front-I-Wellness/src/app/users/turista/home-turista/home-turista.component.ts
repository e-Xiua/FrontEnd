import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-turista',
  imports: [],
  templateUrl: './home-turista.component.html',
  styleUrl: './home-turista.component.css'
})
export class HomeTuristaComponent {
   constructor(private router: Router) {}
      navigateTo(path: string) {
        this.router.navigate([path]);
      }
}
