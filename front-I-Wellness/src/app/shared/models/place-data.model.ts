/**
 * Place Data Model
 *
 * Represents the data structure for displaying provider/place information
 * in the ProviderCardComponent and other UI components that show detailed
 * provider information.
 *
 * This is the single source of truth for provider display data.
 */

export interface PlaceData {
  id: number;
  name: string; // Nombre comercial del proveedor
  contactName?: string; // Nombre del contacto principal
  correo?: string; // Email si disponible
  foto?: string | null; // URL/base64 foto
  category?: string; // Categoría principal
  rating: number; // Rating calculado o fijo
  totalReviews: number; // Número de reviews
  address?: string; // Dirección textual
  hours?: string; // Horario formateado
  description?: string; // Descripción/resumen
  phone?: string; // Teléfono principal
  companyPhone?: string; // Teléfono empresa
  cargoContacto?: string; // Cargo del contacto
  certificadosCalidad?: string[] | null;
  identificacionFiscal?: string | null;
  licenciasPermisos?: string[] | null;
}

/**
 * Extended Place Data with additional information for internal use
 * Used in MapDisplayItem to carry extra data beyond what the card displays
 */
export interface ExtendedPlaceData extends PlaceData {
  services?: any[];
  reviews?: any[];
  categories?: string[];
  averageCost?: number;
  averageVisitDuration?: number;
  provider?: any;
  poiDetails?: any;
}

/**
 * Defaults helper – can be used in templates or adapters to supply UI fallbacks
 */
export const placeDataDefaults: Required<Pick<PlaceData,
  'contactName' | 'correo' | 'category' | 'address' | 'hours' | 'description' | 'phone' | 'companyPhone' | 'cargoContacto'
>> = {
  contactName: 'N/D',
  correo: 'N/D',
  category: 'Sin categoría',
  address: 'Dirección no disponible',
  hours: 'Horario no disponible',
  description: 'Sin descripción',
  phone: 'Teléfono no disponible',
  companyPhone: 'Teléfono empresa no disponible',
  cargoContacto: 'Contacto no disponible'
};
