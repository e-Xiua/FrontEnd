import { EnrichedProviderData } from "../models/provider.models";
import { OptimizedPOI } from "../models/optimization-job.models";
import { MapDisplayItem } from "../models/map-display.model";

export function adaptEnrichedProviderToMapItem(provider: EnrichedProviderData): MapDisplayItem {
  // Extract provider info - backend nests actual contact details in proveedorInfo
  const providerInfo = (provider.provider as any).proveedorInfo || provider.provider;
  
  const coords: [number, number] = [
    parseFloat(provider.provider.coordenadaX as any) || 0,
    parseFloat(provider.provider.coordenadaY as any) || 0
  ];

  return {
    id: provider.provider.id,
    position: coords,
    title: provider.provider.nombre_empresa,
    subtitle: provider.categories.join(', ') || 'N/A',
    iconType: 'default',
    originalData: {
      // Provider Card expects this structure
      id: provider.provider.id,
      name: provider.provider.nombre_empresa,
      // Get contact details from nested proveedorInfo if available
      contactName: providerInfo.cargoContacto || provider.provider.cargoContacto || 'N/A',
      // email is not available in the provider data from the backend
      email: 'N/A',
      foto: null,
      category: provider.categories.length > 0 ? provider.categories[0] : 'N/A',
      rating: 4.5,
      totalReviews: 0,
      address: 'N/A',
      hours: 'N/A',
      description: `Average cost: $${provider.averageCost}, Average visit: ${provider.averageVisitDuration} min`,
      // Get phone details from nested proveedorInfo if available
      phone: providerInfo.telefono || provider.provider.telefono || 'N/A',
      companyPhone: providerInfo.telefonoEmpresa || provider.provider.telefonoEmpresa || 'N/A',
      cargoContacto: providerInfo.cargoContacto || provider.provider.cargoContacto || 'N/A',
      // Additional data
      services: provider.services,
      reviews: [],
      categories: provider.categories,
      averageCost: provider.averageCost,
      averageVisitDuration: provider.averageVisitDuration,
      provider: provider.provider
    }
  };
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

    return {
      id: poi.poiId,
      position: [poi.latitude, poi.longitude],
      title: poi.name || 'Unknown Provider',
      subtitle: categories.length > 0 
        ? `Stop ${index + 1} • ${categories.join(', ')}` 
        : `Stop ${index + 1}`,
      iconType: 'numbered',
      number: index + 1,
      originalData: {
        // Provider Card expects this structure
        id: provider.id || poi.poiId,
        name: provider.nombre_empresa || poi.name || 'Unknown Provider',
        contactName: providerInfo.cargoContacto || provider.cargoContacto || 'N/A',
        email: user.correo || 'N/A', // Get email from the user object
        foto: null,
        category: categories.length > 0 ? categories[0] : 'N/A',
        rating: 4.5, // This could be enhanced to come from provider data
        totalReviews: 0, // This could be enhanced
        address: 'N/A', // Address is not in the current model
        hours: `${poi.arrivalTime || 'N/A'} - ${poi.departureTime || 'N/A'}`,
        description: `Visit order: ${poi.visitOrder}, Estimated visit time: ${poi.estimatedVisitTime} minutes`,
        phone: providerInfo.telefono || provider.telefono || 'N/A',
        companyPhone: providerInfo.telefonoEmpresa || provider.telefonoEmpresa || 'N/A',
        cargoContacto: providerInfo.cargoContacto || provider.cargoContacto || 'N/A',
        // Additional data for services display
        services: services,
        reviews: [],
        categories: categories,
        averageCost: poi.providerData.averageCost || poi.cost || 0,
        averageVisitDuration: poi.providerData.averageVisitDuration || poi.estimatedVisitTime || 30,
        // Include provider info for reference
        provider: provider,
        // Include POI details
        poiDetails: poi
      }
    };
  }
  
  // Fallback to basic data if no enrichment available
  return {
    id: poi.poiId,
    position: [poi.latitude, poi.longitude],
    title: poi.name || 'Unknown Location',
    subtitle: `Stop ${index + 1}`,
    iconType: 'numbered',
    number: index + 1,
    originalData: {
      id: poi.poiId,
      name: poi.name || 'Unknown',
      // Fallback still won't have rich contact data, but we can use what's there
      contactName: 'N/A', 
      email: 'N/A',
      foto: null,
      category: poi.category || 'N/A',
      rating: 0,
      totalReviews: 0,
      address: 'N/A',
      hours: `${poi.arrivalTime || 'N/A'} - ${poi.departureTime || 'N/A'}`,
      description: `Visit order: ${poi.visitOrder}, Estimated visit time: ${poi.estimatedVisitTime} minutes`,
      phone: 'N/A',
      companyPhone: 'N/A',
      cargoContacto: 'N/A',
      services: [],
      reviews: [],
      categories: poi.category ? [poi.category] : [],
      averageCost: poi.cost || 0,
      averageVisitDuration: poi.estimatedVisitTime || 30,
      provider: {
        id: poi.poiId,
        nombre_empresa: poi.name || 'Unknown',
        coordenadax: poi.latitude,
        coordenaday: poi.longitude
      },
      poiDetails: poi
    }
  };
}
