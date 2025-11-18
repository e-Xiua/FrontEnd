/**
 * Backend Provider DTOs
 *
 * Describe the raw shapes returned by backend services before normalization.
 */

import type { Service } from './provider.models';

export interface BackendProveedorInfoDTO {
  id?: number | string;
  nombreEmpresa?: string | null;
  nombre_empresa?: string | null;
  coordenadaX?: string | number | null;
  coordenadaY?: string | number | null;
  cargoContacto?: string | null;
  telefono?: string | null;
  telefonoEmpresa?: string | null;
}

export interface BackendProviderDTO {
  id: number | string;
  foto?: string | null;
  correo?: string | null;
  idProveedor?: number | string;
  nombre?: string | null;
  nombre_empresa?: string | null;
  proveedorInfo?: BackendProveedorInfoDTO | null;
  // Any additional fields passed through
  [key: string]: any;
}

export interface BackendEnrichedProviderDTO {
  provider: BackendProviderDTO;
  services: Service[];
  averageCost: number | null;
  averageVisitDuration: number | null;
  categories: string[] | null;
  metadata?: Record<string, any>;
}
