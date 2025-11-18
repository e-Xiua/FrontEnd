import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapForAllProvidersComponent } from "../../../../shared/components/map-for-all-providers/map-for-all-providers.component";


@Component({
  selector: 'app-mapa-empresas',
  imports: [
    CommonModule,
    MapForAllProvidersComponent
],
  templateUrl: './mapa-empresas.component.html',
  styleUrls: ['./mapa-empresas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapaEmpresasComponent {

}
