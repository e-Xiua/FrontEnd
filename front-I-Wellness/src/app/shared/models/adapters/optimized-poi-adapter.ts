import { Injectable } from '@angular/core';
import { OptimizedPOI } from '../../services/route-optimization.service';
import { Roles } from '../roles';
import { usuarios } from '../usuarios';


@Injectable({
  providedIn: 'root'
})
export class OptimizedPoiAdapterService {

  constructor() { }

  /**
   * Adapts a single OptimizedPOI object to a usuarios object.
   * @param poi The OptimizedPOI to adapt.
   * @returns A usuarios object compatible with other components.
   */
  public adapt(poi: OptimizedPOI): usuarios {

    console.log('Adapting OptimizedPOI to usuarios:', poi);
    // The core of the Adapter Pattern: mapping fields from one interface to another.
    return {
      id: poi.poiId,
      nombre: poi.name,
      correo: `provider-${poi.poiId}@email.mock`, // OptimizedPOI doesn't have an email, so we create a placeholder.
      foto: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(poi.name)}`, // Placeholder avatar
      rol: { id: 2, name: 'Proveedor' } as Roles,
      proveedorInfo: {
        // This is the crucial part for the map component.
        // We are creating the nested object that MapPoiComponent expects.
        nombre_empresa: poi.name,
        latitud: poi.latitude,
        longitud: poi.longitude,
        // Add other potential fields with default values if needed
        direccion: 'Dirección no disponible en ruta optimizada',
        telefono: 'N/A',
        // We can even store the optimization-specific data here for later use!
        visitOrder: poi.visitOrder,
        estimatedVisitTime: poi.estimatedVisitTime,
        arrivalTime: poi.arrivalTime,
        departureTime: poi.departureTime
      },
      turistaInfo: null // Not a tourist
    };
  }

  /**
   * Adapts an array of OptimizedPOI objects to an array of usuarios objects.
   * @param pois The array of OptimizedPOI to adapt.
   * @returns An array of usuarios objects.
   */
  public adaptAll(pois: OptimizedPOI[]): usuarios[] {
    if (!pois) {
      return [];
    }
    // Sort by visitOrder before adapting to ensure the sequence is correct.
    const sortedPois = [...pois].sort((a, b) => a.visitOrder - b.visitOrder);
    return sortedPois.map(poi => this.adapt(poi));
  }
}
