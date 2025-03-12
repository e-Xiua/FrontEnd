import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-turista',
  imports: [],
  templateUrl: './header-turista.component.html',
  styleUrl: './header-turista.component.css'
})
export class HeaderTuristaComponent {
  constructor(private router: Router) {}
  navigateTo(path: string) {
    this.router.navigate([path]);
  }

}
