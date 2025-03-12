import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-proveedor',
  imports: [],
  templateUrl: './home-proveedor.component.html',
  styleUrl: './home-proveedor.component.css'
})
export class HomeProveedorComponent {
  constructor(private router: Router) {}
          navigateTo(path: string) {
            this.router.navigate([path]);
          }
  

}
