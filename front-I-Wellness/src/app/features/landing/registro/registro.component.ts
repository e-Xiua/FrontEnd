import { Component, EventEmitter, Output, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-Registro',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {

  @Output() fondoBlanco = new EventEmitter<boolean>();
  

  //Navegar a register turista

  constructor(private router: Router) {}
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
