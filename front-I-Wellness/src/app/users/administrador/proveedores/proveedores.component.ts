import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-proveedores',
  imports: [],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent {
  constructor(private router: Router) {}
          navigateTo(path: string) {
            this.router.navigate([path]);
          }
}
