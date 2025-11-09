import { MapDisplayItem } from "../models/map-display.model";
import { OptimizedPOI } from "../models/optimization-job.models";
import { ExtendedPlaceData } from "../models/place-data.model";
import { EnrichedProviderData } from "../models/provider.models";

// ---- Service mapping helpers ----
interface ServiceDisplay {
  id: number | string;
  title: string;
  description: string;
  image: string;
  schedule: string;
  duration: number | string | undefined;
  price: string; // formatted price (e.g. $123)
}

function mapRawServiceToDisplay(raw: any): ServiceDisplay {
  const priceValue = raw?.precio ?? raw?.price;
  return {
    id: raw?._idServicio ?? raw?.id ?? crypto.randomUUID(),
    title: raw?.nombre ?? raw?.title ?? 'Servicio',
    description: raw?.descripcion ?? raw?.description ?? '',
    image: raw?.imagen ?? raw?.image ?? raw?.foto ?? 'assets/img/placeholder-provider.svg',
    schedule: raw?.horario ?? raw?.schedule ?? '',
    duration: raw?.tiempoAproximado ?? raw?.duracion ?? raw?.duration,
    price: priceValue != null && priceValue !== '' ? `$${priceValue}` : ''
  };
}

function mapServicesArray(services: any[] | undefined): ServiceDisplay[] {
  if (!Array.isArray(services)) return [];
  return services.map(mapRawServiceToDisplay);
}

export function adaptEnrichedProviderToMapItem(provider: EnrichedProviderData): MapDisplayItem {
  // Provider is already normalized; coordinates are numbers
  const coords: [number, number] = [provider.provider.coordenadaX, provider.provider.coordenadaY];

  const placeData = adaptProviderToPlaceData(provider);

  return {
    id: provider.provider.id,
    position: coords,
    title: provider.provider.nombre_empresa,
    subtitle: provider.categories.length ? provider.categories.join(', ') : 'Sin categorías',
    iconType: 'default',
    originalData: placeData
  };
}

/**
 * Convert normalized enriched provider to PlaceData structure for card
 */
export function adaptProviderToPlaceData(provider: EnrichedProviderData): ExtendedPlaceData {
  const data: ExtendedPlaceData = {
    id: provider.provider.id,
    name: provider.provider.nombre_empresa,
    contactName: provider.provider.cargoContacto || undefined,
    email: undefined, // email not present in current model – keep undefined, template decides placeholder
    foto: null,
    category: provider.categories[0] || undefined,
    rating: 4.5,
    totalReviews: 0,
    address: undefined, // template can use defaults
    hours: undefined,
    description: provider.averageCost || provider.averageVisitDuration
      ? `Costo promedio: $${provider.averageCost} • Visita promedio: ${provider.averageVisitDuration} min`
      : undefined,
    phone: provider.provider.telefono || undefined,
    companyPhone: provider.provider.telefonoEmpresa || undefined,
    cargoContacto: provider.provider.cargoContacto || undefined,
    services: mapServicesArray(provider.services),
    reviews: [] as any[],
    categories: provider.categories,
    averageCost: provider.averageCost,
    averageVisitDuration: provider.averageVisitDuration,
    provider: provider.provider
  };
  return data;
}

export function adaptOptimizedPoiToMapItem(poi: OptimizedPOI, index: number): MapDisplayItem {
  // If enriched provider data is available, use it for richer display
  if (poi.providerData && typeof poi.providerData === 'object') {
    const categories = Array.isArray(poi.providerData.categories) ? poi.providerData.categories : [];
    const services = Array.isArray(poi.providerData.services) ? poi.providerData.services : [];
    const provider = poi.providerData.provider || {};

    // The user object is nested inside the providerData
    const user = poi.providerData.user || {};

    // Backend nests actual contact details in proveedorInfo
    const providerInfo = (provider as any).proveedorInfo || provider;

    // Build base place data (avoid 'N/A'; use undefined so template applies defaults)
    const placeData: ExtendedPlaceData = {
      id: provider.id || poi.poiId,
      name: provider.nombre_empresa || poi.name || 'Proveedor',
      contactName: providerInfo.cargoContacto || provider.cargoContacto || undefined,
      email: user.correo || undefined,
      foto: null,
      category: categories[0] || undefined,
      rating: 4.5,
      totalReviews: 0,
      address: undefined,
      hours: poi.arrivalTime || poi.departureTime ? `${poi.arrivalTime || ''}${poi.departureTime ? ' - ' + poi.departureTime : ''}` : undefined,
      description: `Visit order: ${poi.visitOrder}, Estimated visit time: ${poi.estimatedVisitTime} minutes`,
      phone: providerInfo.telefono || provider.telefono || undefined,
      companyPhone: providerInfo.telefonoEmpresa || provider.telefonoEmpresa || undefined,
      cargoContacto: providerInfo.cargoContacto || provider.cargoContacto || undefined,
      services: mapServicesArray(services),
      reviews: [],
      categories: categories,
      averageCost: poi.providerData.averageCost || poi.cost || 0,
      averageVisitDuration: poi.providerData.averageVisitDuration || poi.estimatedVisitTime || 30,
      provider: provider,
      poiDetails: poi
    };

    return {
      id: poi.poiId,
      position: [poi.latitude, poi.longitude],
      title: placeData.name || 'Proveedor',
      subtitle: categories.length > 0
        ? `Stop ${index + 1} • ${categories.join(', ')}`
        : `Stop ${index + 1}`,
      iconType: 'numbered',
      number: index + 1,
      originalData: placeData
    };
  }

  // Fallback to basic data if no enrichment available
  const fallbackPlace: ExtendedPlaceData = {
    id: poi.poiId,
    name: poi.name || 'Proveedor',
    contactName: undefined,
    email: undefined,
    foto: null,
    category: poi.category || undefined,
    rating: 0,
    totalReviews: 0,
    address: undefined,
    hours: poi.arrivalTime || poi.departureTime ? `${poi.arrivalTime || ''}${poi.departureTime ? ' - ' + poi.departureTime : ''}` : undefined,
    description: `Visit order: ${poi.visitOrder}, Estimated visit time: ${poi.estimatedVisitTime} minutes`,
    phone: undefined,
    companyPhone: undefined,
    cargoContacto: undefined,
    services: [],
    reviews: [],
    categories: poi.category ? [poi.category] : [],
    averageCost: poi.cost || 0,
    averageVisitDuration: poi.estimatedVisitTime || 30,
    provider: {
      id: poi.poiId,
      nombre_empresa: poi.name || 'Proveedor',
      coordenadax: poi.latitude,
      coordenaday: poi.longitude
    },
    poiDetails: poi
  };

  return {
    id: poi.poiId,
    position: [poi.latitude, poi.longitude],
    title: fallbackPlace.name || 'Proveedor',
    subtitle: `Stop ${index + 1}`,
    iconType: 'numbered',
    number: index + 1,
    originalData: fallbackPlace
  };
}
