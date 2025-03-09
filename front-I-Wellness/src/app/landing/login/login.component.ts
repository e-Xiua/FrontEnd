import { Component, EventEmitter, Output, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  @Output() fondoBlanco = new EventEmitter<boolean>();
  

  //Navegar a login turista

  constructor(private router: Router) {}
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
