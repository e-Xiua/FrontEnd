/**
 * Domain Provider Models (normalized)
 */

import type { Service } from './provider.models';

export interface ProviderDomain {
  id: number;
  nombre_empresa: string;
  coordenadaX: number; // latitude
  coordenadaY: number; // longitude
  cargoContacto?: string;
  telefono?: string;
  telefonoEmpresa?: string;
}

export interface EnrichedProviderDataNormalized {
  provider: ProviderDomain;
  services: Service[];
  averageCost: number;
  averageVisitDuration: number;
  categories: string[];
  isFallback?: boolean;
}
