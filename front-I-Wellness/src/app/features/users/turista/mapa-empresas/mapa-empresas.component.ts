import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { UsuarioService } from '../../services/usuario.service';
import { usuarios } from '../../../../shared/models/usuarios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mapa-empresas',
  templateUrl: './mapa-empresas.component.html',
  styleUrl: './mapa-empresas.component.css',
})
export class MapaEmpresasComponent implements AfterViewInit {
  private map!: L.Map;
  private tooltips: L.Tooltip[] = [];


  constructor(private usuarioServicio: UsuarioService, private router: Router) {}

  ngAfterViewInit(): void {
    // ← elimina la búsqueda por defecto
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    // ← ponte la ruta donde copiaste las imágenes
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [10.501005998543437, -84.6972559489806],
      zoom: 13,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.usuarioServicio.obtenerProveedores().subscribe({
      next: (proveedores) => this.pintarProveedores(proveedores),
      error: (err) => console.error('Error al obtener proveedores', err),
    });
  }

  private pintarProveedores(lista: usuarios[]): void {
  this.tooltips = []; // Reinicia la lista
  lista.forEach((p) => {
    const info = Object.values(p).find(
      (v) => v && typeof v === 'object' && 'coordenadaX' in v && 'coordenadaY' in v
    ) as { coordenadaX: string; coordenadaY: string } | undefined;

    if (!info) return;

    const lat = parseFloat(info.coordenadaX);
    const lng = parseFloat(info.coordenadaY);
    if (isNaN(lat) || isNaN(lng)) return;

    const raw = Object.values(p).find(v =>
      v && typeof v === 'object' && 'nombre_empresa' in v && 'telefono' in v
    );

    if (raw) {
      const empresa = {
        nombre: raw.nombre_empresa,
        foto: p.foto,
        id: p.id
      };

      const popupContent = `
        <div class="popup-card">
          <a href="javascript:void(0);" onclick="window.sessionStorage.setItem('nombreEmpresa', '${empresa.nombre}'); window.location.href='/proveedor/${p.id}';">
            <div class="popup-img-container">
              <img src="${empresa.foto}" alt="${empresa.nombre}" class="popup-img" />
            </div>
            <h3 class="popup-title">${empresa.nombre}</h3>
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng])
        .addTo(this.map)
        .bindPopup(popupContent);

      const tooltipInstance = marker.bindTooltip(empresa.nombre, {
        permanent: false,
        direction: 'bottom',
        offset: [0, 10],
        className: 'custom-tooltip'
      }).getTooltip();

      if (tooltipInstance) {
        this.tooltips.push(tooltipInstance);
      }
    }
  });

  this.adjustTooltipsVisibility();
}

private adjustTooltipsVisibility(): void {
  this.map.on('zoomend moveend', () => {
    const zoom = this.map.getZoom();

    this.tooltips.forEach((tooltip) => {
      const el = tooltip.getElement();
      if (el) {
        if (zoom < 12) {
          el.style.display = 'none';
        } else {
          el.style.display = 'block';
        }
      }
    });
  });
}
}
