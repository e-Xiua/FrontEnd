import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-admin',
  imports: [],
  templateUrl: './perfil-admin.component.html',
  styleUrl: './perfil-admin.component.css'
})
export class PerfilAdminComponent {
   constructor(private router: Router) {}
        navigateTo(path: string) {
          this.router.navigate([path]);
        }

}
