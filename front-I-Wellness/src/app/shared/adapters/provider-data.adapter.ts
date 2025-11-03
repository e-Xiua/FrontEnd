/**
 * Provider Data Adapter
 * 
 * Transforms backend provider data into EnrichedProviderData format
 * that the frontend components expect.
 */

import { Injectable } from '@angular/core';
import { EnrichedProviderData, Provider, Service } from '../models/route-generation/provider.models';

/**
 * Backend response structure from UsuarioService.obtenerProveedores()
 */
export interface BackendProviderResponse {
  id: number;
  nombre: string;
  correo: string;
  rol: {
    id: number;
    nombre: string;
  };
  proveedor: {
    id: number;
    nombre_empresa: string;
    cargoContacto: string;
    telefono: string;
    telefonoEmpresa: string;
    coordenadaX: string;
    coordenadaY: string;
  };
  proveedorInfo?: {
    id: number;
    nombreEmpresa: string;
    cargoContacto: string;
    telefono: string;
    telefonoEmpresa: string;
    coordenadaX: string;
    coordenadaY: string;
  };
}

/**
 * Service response from providers API
 */
export interface BackendServiceResponse {
  _idServicio: number;
  nombre: string;
  descripcion: string;
  costo: number;
  duracion: number;
  estado: boolean;
  _idProveedor: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProviderDataAdapter {

  /**
   * Transform backend provider data to EnrichedProviderData
   */
  adaptProvider(
    backendProvider: BackendProviderResponse,
    services: BackendServiceResponse[] = []
  ): EnrichedProviderData {
    
    // Get provider info (could be in proveedor or proveedorInfo)
    const providerInfo = backendProvider.proveedorInfo || backendProvider.proveedor;
    
    if (!providerInfo) {
      console.error('Provider has no proveedor or proveedorInfo:', backendProvider);
      throw new Error(`Provider ${backendProvider.id} has no provider information`);
    }

    // Get empresa name (could be nombreEmpresa or nombre_empresa)
    const empresaName = ('nombreEmpresa' in providerInfo) 
      ? providerInfo.nombreEmpresa 
      : providerInfo.nombre_empresa;

    // Transform to Provider model (matching the interface exactly)
    const provider: Provider = {
      id: backendProvider.id,
      nombre_empresa: empresaName || 'Unknown',
      coordenadax: parseFloat(providerInfo.coordenadaX || '0'),
      coordenaday: parseFloat(providerInfo.coordenadaY || '0')
    };

    // Debug: Log raw services
    console.log(`[Adapter] Raw services for provider ${backendProvider.id}:`, services);

    // Transform services (matching Service interface exactly)
    const adaptedServices: Service[] = services.map(service => {
      console.log(`[Adapter] Transforming service:`, {
        id: service._idServicio,
        nombre: service.nombre,
        costo: service.costo,
        duracion: service.duracion,
        tipo_costo: typeof service.costo,
        tipo_duracion: typeof service.duracion
      });

      return {
        idServicio: service._idServicio,
        nombre: service.nombre,
        descripcion: service.descripcion || '',
        precio: service.costo || 0, // Default to 0 if null/undefined
        tiempoAproximado: service.duracion || 0 // Default to 0 if null/undefined
      };
    });

    console.log(`[Adapter] Adapted services:`, adaptedServices);

    // Calculate average cost - filter out services with 0 or invalid prices
    const validPrices = adaptedServices
      .map(s => s.precio)
      .filter(precio => precio != null && precio > 0 && !isNaN(precio));

    const avgCost = validPrices.length > 0
      ? validPrices.reduce((sum, precio) => sum + precio, 0) / validPrices.length
      : 0;

    console.log(`[Adapter] Valid prices:`, validPrices, `Average:`, avgCost);

    // Calculate average visit duration - filter out services with 0 or invalid durations
    const validDurations = adaptedServices
      .map(s => s.tiempoAproximado)
      .filter(duracion => duracion != null && duracion > 0 && !isNaN(duracion));

    const avgDuration = validDurations.length > 0
      ? validDurations.reduce((sum, duracion) => sum + duracion, 0) / validDurations.length
      : 30; // Default to 30 minutes if no valid durations

    console.log(`[Adapter] Valid durations:`, validDurations, `Average:`, avgDuration);

    // Extract categories from service names
    const categories = [...new Set(
      adaptedServices
        .map(s => s.nombre.split(' ')[0])
        .filter(cat => cat && cat.length > 0)
    )];

    console.log(`[Adapter] Extracted categories:`, categories);

    const enrichedData = {
      provider,
      services: adaptedServices,
      averageCost: avgCost,
      averageVisitDuration: avgDuration,
      categories
    };

    console.log(`[Adapter] Final enriched data:`, enrichedData);

    return enrichedData;
  }

  /**
   * Transform array of backend providers
   */
  adaptProviders(
    backendProviders: BackendProviderResponse[],
    servicesMap: Map<number, BackendServiceResponse[]> = new Map()
  ): EnrichedProviderData[] {
    return backendProviders.map(provider => {
      const services = servicesMap.get(provider.id) || [];
      return this.adaptProvider(provider, services);
    });
  }
}
