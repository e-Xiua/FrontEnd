import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { usuarios } from '../../../../shared/models/usuarios';
import { MapConfig, MapPoiComponent } from '../../../../shared/ui/components/map-poi/map-poi.component';
import { RoutePoisShowComponent } from "../../../../shared/ui/components/route-pois-show/route-pois-show.component";
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-mapa-empresas',
  templateUrl: './mapa-empresas.component.html',
  styleUrls: ['./mapa-empresas.component.css'],
  imports: [CommonModule, MapPoiComponent, RoutePoisShowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class MapaEmpresasComponent implements OnInit {

  providers: usuarios[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  mapConfig: MapConfig = {
    center: [10.501005998543437, -84.6972559489806],
    zoom: 13,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerOptions: {
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  constructor(
    private usuarioServicio: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProviders();
  }

  private loadProviders(): void {
    this.isLoading = true;
    this.error = null;

    this.usuarioServicio.obtenerProveedores().subscribe({
      next: (proveedores) => {
        console.log('Proveedores obtenidos:', proveedores);
        this.providers = proveedores;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al obtener proveedores', err);
        this.error = 'Error al cargar los proveedores';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onProviderSelected(providerData: any): void {
    console.log('Provider selected in mapa-empresas:', providerData);
    // Aquí puedes agregar lógica adicional específica para mapa-empresas
    // como navegación, analytics, etc.
  }

  onMapInitialized(): void {
    console.log('Map initialized in mapa-empresas');
    // Lógica adicional después de que el mapa se inicialice
  }

  retryLoad(): void {
    this.loadProviders();
  }
}
