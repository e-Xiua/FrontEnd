import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { HeaderService } from '../../../../shared/services/header.service';
import { Subject, takeUntil } from 'rxjs';

interface NavigationItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-header-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-admin.component.html',
  styleUrl: './header-admin.component.css'
})
export class HeaderAdminComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer?: ElementRef;

  usuario: any;
  defaultAvatar = 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg';
  
  navigationItems: NavigationItem[] = [];
  canScrollLeft = false;
  canScrollRight = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router, 
    private authService: AuthService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    // Cargar información del usuario
    this.authService.usuarioHome().subscribe({
      next: (data: string) => {
        this.usuario = JSON.parse(data);
        console.log('Usuario admin:', this.usuario);
      },
      error: (err: any) => {
        console.error('Error al obtener el usuario:', err);
      }
    });

    // Cargar configuración del header desde el servicio
    this.headerService.headerConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        if (config && config.role === 'admin') {
          this.navigationItems = config.config.navigationItems || [];
        }
      });

    // Configurar header para admin
    this.headerService.setHeaderForRole('admin');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScrollIndicators();
  }

  ngAfterViewInit(): void {
    // Check scroll indicators after view initialization
    setTimeout(() => {
      this.checkScrollIndicators();
    }, 100);
  }

  checkScrollIndicators(): void {
    const container = document.querySelector('.navbar-scroll-content') as HTMLElement;
    if (container) {
      this.canScrollLeft = container.scrollLeft > 0;
      this.canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 5);
    }
  }

  scrollLeft(): void {
    const container = document.querySelector('.navbar-scroll-content') as HTMLElement;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
      setTimeout(() => this.checkScrollIndicators(), 300);
    }
  }

  scrollRight(): void {
    const container = document.querySelector('.navbar-scroll-content') as HTMLElement;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
      setTimeout(() => this.checkScrollIndicators(), 300);
    }
  }

  navigateToProfile(): void {
    if (this.usuario?.id) {
      this.router.navigate(['/admin/perfil', this.usuario.id]);
    }
  }

  logout(): void {
    this.headerService.clearHeader();
    localStorage.clear();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateTo(path: string, param?: any) {
    if (param !== undefined) {
      this.router.navigate([path, param]);
    } else {
      localStorage.clear();
      this.router.navigate([path]);
    }
  }
}
