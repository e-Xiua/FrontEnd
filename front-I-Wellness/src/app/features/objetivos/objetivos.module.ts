import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObjetivosComponent } from './objetivos.component';
import { ObjetivosTuristaComponent } from './objetivos-turista.component';
import { ObjetivosProveedorComponent } from './objetivos-proveedor.component';
import { ObjetivosAdminComponent } from './objetivos-admin.component';

@NgModule({
  declarations: [
    ObjetivosComponent,
    ObjetivosTuristaComponent,
    ObjetivosProveedorComponent,
    ObjetivosAdminComponent
  ],
  imports: [CommonModule],
  exports: [ObjetivosComponent]
})
export class ObjetivosModule {}
