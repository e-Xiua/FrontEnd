import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-proveedor',
  imports: [],
  templateUrl: './registro-proveedor.component.html',
  styleUrl: './registro-proveedor.component.css'
})
export class RegistroProveedorComponent {

    constructor(private router: Router) {}
        navigateTo(path: string) {
          this.router.navigate([path]);
        }

}
