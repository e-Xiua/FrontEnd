import { Injectable } from '@angular/core';
import { usuarios } from '../../../shared/models/usuarios';
import { MarkerConfig, ServiceCardConfig } from './map.service';

@Injectable({
  providedIn: 'root'
})
export class ProveedorMapService {

  constructor() {}

  extractCoordinates(proveedores: usuarios[]): [number, number][] {
    return proveedores
      .map(p => {
        const info = Object.values(p).find(
          (v) => v && typeof v === 'object' && 'coordenadaX' in v && 'coordenadaY' in v
        ) as { coordenadaX: string; coordenadaY: string } | undefined;

        if (!info) return null;

        const lat = parseFloat(info.coordenadaX);
        const lng = parseFloat(info.coordenadaY);

        return !isNaN(lat) && !isNaN(lng) ? [lat, lng] as [number, number] : null;
      })
      .filter(coord => coord !== null) as [number, number][];
  }

  createMarkerConfigs(proveedores: usuarios[]): MarkerConfig[] {
    return proveedores
      .map(p => {
        const info = this.getCoordinatesFromProvider(p)

        if (!info) return null;

        const raw = Object.values(p).find(v =>
          v && typeof v === 'object' && 'nombre_empresa' in v && 'telefono' in v
        );

        if (!raw) return null;

        const popupContent = `
          <div class="popup-card">
            <a href="javascript:void(0);" onclick="window.sessionStorage.setItem('nombreEmpresa', '${raw.nombre_empresa}'); window.location.href='/proveedor/${p.id}';">
              <div class="popup-img-container">
                <img src="${p.foto}" alt="${raw.nombre_empresa}" class="popup-img" />
              </div>
              <h3 class="popup-title">${raw.nombre_empresa}</h3>
            </a>
          </div>
        `;

        return {
          position: [info[0], info[1]] as [number, number],
          popupContent: popupContent,
          tooltipContent: raw.nombre_empresa,
          providerData: {
      id: p.id, // Use the provider's ID, not raw.id
  nombre_empresa: raw.nombre_empresa,
  foto: p.foto || raw.foto, // Include both possible sources
  categoria: raw.categoria,
  rating: raw.rating ?? 4.5,
  totalReviews: raw.totalReviews ?? 0,
  address: raw.direccion,
  hours: raw.horario,
  description: raw.descripcion,
  // Add the missing fields that your mapping expects
  nombre: p.nombre, // For contactName
  correo: p.correo, // For email
  telefono: raw.telefono,
  telefonoEmpresa: raw.telefonoEmpresa,
  cargoContacto: raw.cargoContacto,
  certificadosCalidad: raw.certificadosCalidad,
  identificacionFiscal: raw.identificacionFiscal,
  licenciasPermisos: raw.licenciasPermisos
    }
        };
      })
      .filter(config => config !== null) as MarkerConfig[];
  }

createServiceCardConfigs(proveedores: any[]): ServiceCardConfig[] {
  interface RawProveedor {
    nombre_empresa: string;
    telefono: string;
    telefonoEmpresa?: string;
    cargoContacto?: string;
    certificadosCalidad?: string | null;
    identificacionFiscal?: string | null;
    licenciasPermisos?: string | null;
    direccion?: string;
    horario?: string;
    descripcion?: string;
    category?: string;
    rating?: number;
    totalReviews?: number;
  }

  interface ServiceCardConfigExtended extends ServiceCardConfig {
    id: any;
    name: string;
    contactName: string;
    email: string;
    foto: string;
    category: string;
    rating: number;
    totalReviews: number;
    address: string;
    hours: string;
    description: string;
    phone: string;
    companyPhone: string;
    cargoContacto: string;
    certificadosCalidad: string | null;
    identificacionFiscal: string | null;
    licenciasPermisos: string | null;
    position: [number, number] | undefined; // Usa undefined, no null
  }

  return proveedores
    .map((p: any): ServiceCardConfigExtended | null => {
      const raw = Object.values(p).find(v =>
        v && typeof v === 'object' && 'nombre_empresa' in v && 'telefono' in v
      ) as RawProveedor | undefined;

      if (!raw) return null;

      return {
  id: p.id,
  name: raw.nombre_empresa || 'Empresa no disponible',
  contactName: p.nombre || 'Contacto no disponible',
  email: p.correo || 'Email no disponible',
  foto: p.foto || 'https://via.placeholder.com/150',
  category: raw.category || 'Categoría no disponible',
  rating: raw.rating ?? 4.5,
  totalReviews: raw.totalReviews ?? 0,
  address: raw.direccion || 'Dirección no disponible',
  hours: raw.horario || 'Horario no disponible',
  description: raw.descripcion || 'Descripción no disponible',
  phone: raw.telefono || 'Teléfono no disponible',
  companyPhone: raw.telefonoEmpresa || raw.telefono || 'Teléfono empresa no disponible',
  cargoContacto: raw.cargoContacto || 'Cargo no disponible',
  certificadosCalidad: raw.certificadosCalidad || null,
  identificacionFiscal: raw.identificacionFiscal || null,
  licenciasPermisos: raw.licenciasPermisos || null,
  position: this.getCoordinatesFromProvider(p) ?? undefined,
  nombre_empresa: raw.nombre_empresa,
  nombreContacto: raw.nombre_empresa,
  telefono: raw.telefono,
  telefonoEmpresa: raw.telefonoEmpresa || raw.telefono
};
    })
    .filter((config): config is ServiceCardConfigExtended => config !== null);
}
 createMapConfigs(proveedores: usuarios[]): {
    markerConfigs: any[],
    serviceCardConfigs: ServiceCardConfig[]
  } {
    const serviceCardConfigs = this.createServiceCardConfigs(proveedores);

    const markerConfigs = serviceCardConfigs
      .map(cardConfig => {
        const position = this.getCoordinatesFromProvider(
          proveedores.find(p => this.getProviderId(p) === this.getCardId(cardConfig))!
        );

        if (!position) return null;

        const popupContent = this.createPopupContent(cardConfig);

        return {
          position: position,
          popupContent: popupContent,
          tooltipContent: cardConfig.nombre_empresa,
          providerData: cardConfig // Pasamos la data completa
        };
      })
      .filter(config => config !== null);

    return {
      markerConfigs,
      serviceCardConfigs
    };
  }

    private createPopupContent(cardConfig: ServiceCardConfig): string {
    return `
      <div class="popup-card">
        <a href="javascript:void(0);"
           onclick="window.sessionStorage.setItem('nombreEmpresa', '${cardConfig.nombre_empresa}');
                    window.location.href='/proveedor/${this.getCardId(cardConfig)}';">
          <div class="popup-img-container">
            <img src="${cardConfig.foto}" alt="${cardConfig.nombre_empresa}" class="popup-img" />
          </div>
          <h3 class="popup-title">${cardConfig.nombre_empresa}</h3>
        </a>
      </div>
    `;
  }

    private getProviderId(proveedor: usuarios): any {
    // Implementa lógica para obtener el ID del proveedor
    return proveedor.id || proveedor.nombre;
  }

  private getCardId(cardConfig: ServiceCardConfig): any {
    // Implementa lógica para obtener el ID de la card
    return (cardConfig as any).id || cardConfig.nombre_empresa;
  }

    private getCoordinatesFromProvider(proveedor: usuarios): [number, number] | null {
    const info = Object.values(proveedor).find(
      (v) => v && typeof v === 'object' && 'coordenadaX' in v && 'coordenadaY' in v
    ) as { coordenadaX: string; coordenadaY: string } | undefined;

    if (!info) return null;

    const lat = parseFloat(info.coordenadaX);
    const lng = parseFloat(info.coordenadaY);

    return !isNaN(lat) && !isNaN(lng) ? [lat, lng] : null;
  }
}
