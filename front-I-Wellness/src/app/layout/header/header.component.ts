import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
//Opciones del menu
  menuOption: string = "";

  onOption(menuOption: string) {
    this.menuOption = menuOption;
  }



//Cuando se hace scroll en la página, se activa la clase isScrolled
  isScrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  //Cuando el fondo es blanco, cambia de color
  isWhiteBackground = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Detecta el scroll para cambiar la clase "scrolled"
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 50;
    });

    // Detecta cambios en la ruta y aplica la clase si está en "login"
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isWhiteBackground = event.url === '/login'; // Si la URL es "/login", cambia el estilo
      }
    });
  }



}
