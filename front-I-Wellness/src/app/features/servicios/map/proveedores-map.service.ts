import { Injectable } from '@angular/core';
import { MarkerConfig } from './map.service';
import { Provider } from '../../../shared/models/provider.models';

@Injectable({
  providedIn: 'root'
})
export class ProveedorMapService {

  constructor() {}

  createMarkerConfigs(proveedores: Provider[]): MarkerConfig[] {
    return proveedores
      .map(p => {
        const position: [number, number] = [p.coordenadaX, p.coordenadaY];

        const popupContent = `
          <div class="popup-card">
            <a href="javascript:void(0);" onclick="window.sessionStorage.setItem('nombreEmpresa', '${p.nombre_empresa}'); window.location.href='/proveedor/${p.id}';">
              <h3 class="popup-title">${p.nombre_empresa}</h3>
            </a>
          </div>
        `;

        return {
          position: position,
          popupContent: popupContent,
          tooltipContent: p.nombre_empresa,
          providerData: {
            id: p.id,
            nombre_empresa: p.nombre_empresa,
          }
        };
      })
      .filter(config => config !== null) as MarkerConfig[];
  }
}
