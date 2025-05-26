import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-header-admin',
  imports: [],
  templateUrl: './header-admin.component.html',
  styleUrl: './header-admin.component.css'
})
export class HeaderAdminComponent {

  usuario: any;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.usuarioHome().subscribe({
      next: (data: string) => {
        this.usuario = data;
        this.usuario = JSON.parse(data);
        console.log(this.usuario)
      },
      error: (err: any) => {
        console.error('Error al obtener el usuario:', err);
      }
    });
  }

  navigateTo(path: string, param?: any) {
    // Si hay un parámetro y no es undefined, navegar con parámetro
    if (param !== undefined) {
      this.router.navigate([path, param]);
    } else {
      // Si no hay parámetro o es undefined, navegar solo con la ruta
      localStorage.clear();
      this.router.navigate([path]);
    }
  }
}
