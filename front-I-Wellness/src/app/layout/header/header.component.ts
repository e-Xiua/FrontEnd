import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
<<<<<<< HEAD
import { AuthService } from '../../core/services/auth/auth.service';
=======
import { Subject, takeUntil } from 'rxjs';
import { HeaderConfig } from '../../shared/models/header';
import { usuarios } from '../../shared/models/usuarios';
import { HeaderService } from '../../shared/services/header.service';
import { ProviderSearchComponent } from '../../shared/ui/components/provider-search/provider-search.component';
>>>>>>> 8285f53 (Mejoras Visuales - Home Contacto)

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ProviderSearchComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
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

<<<<<<< HEAD
  constructor(private router: Router, public authService: AuthService) {}
=======
  // Header configuration from service
  headerConfig: HeaderConfig | null = null;
  showProviderSearch = false;
>>>>>>> 8285f53 (Mejoras Visuales - Home Contacto)

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly headerService: HeaderService
  ) {}

  ngOnInit(): void {
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

    // Subscribe to header configuration changes
    this.headerService.headerConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config: HeaderConfig | null) => {
        this.headerConfig = config;
        this.showProviderSearch = config?.config?.showProviderSearch ?? false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onProviderSelected(provider: usuarios): void {
    console.log('Proveedor seleccionado:', provider);

    // Navigate to provider's public profile
    if (provider.id) {
      this.router.navigate(['/proveedor/ver-perfil', provider.id]);
    }
  }
}
