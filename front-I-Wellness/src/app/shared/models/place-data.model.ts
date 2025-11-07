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
  name: string;
  contactName: string;
  email: string;
  foto?: string | null;
  category: string;
  rating: number;
  totalReviews: number;
  address: string;
  hours: string;
  description: string;
  phone: string;
  companyPhone: string;
  cargoContacto: string;
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
