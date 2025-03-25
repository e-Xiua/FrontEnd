import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-proveedor',
  imports: [],
  templateUrl: './header-proveedor.component.html',
  styleUrl: './header-proveedor.component.css'
})
export class HeaderProveedorComponent {
    constructor(private router: Router) {}
    navigateTo(path: string) {
      this.router.navigate([path]);
    }
}
