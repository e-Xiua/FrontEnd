
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObjetivosTuristaComponent } from './objetivos-turista.component';
import { ObjetivosProveedorComponent } from './objetivos-proveedor.component';
import { ObjetivosAdminComponent } from './objetivos-admin.component';

@Component({
  selector: 'app-objetivos',
  standalone: true,
  imports: [CommonModule, ObjetivosTuristaComponent, ObjetivosProveedorComponent, ObjetivosAdminComponent],
  templateUrl: './objetivos.component.html',
  styleUrls: ['./objetivos.component.css']
})
export class ObjetivosComponent {
  rol: 'turista' | 'proveedor' | 'admin' = 'turista';
}
