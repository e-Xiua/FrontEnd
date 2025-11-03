import { EnrichedProviderData, OptimizedPOI } from "../models/route-generation";
import { MapDisplayItem } from "../models/map-display.model";

export function adaptEnrichedProviderToMapItem(provider: EnrichedProviderData): MapDisplayItem {
  const coords: [number, number] = [
    provider.provider.coordenadax,
    provider.provider.coordenaday
  ];

  return {
    id: provider.provider.id,
    position: coords,
    title: provider.provider.nombre_empresa,
    subtitle: provider.categories.join(', '),
    iconType: 'default',
    originalData: provider
  };
}

export function adaptOptimizedPoiToMapItem(poi: OptimizedPOI, index: number): MapDisplayItem {
  return {
    id: poi.poiId,
    position: [poi.latitude, poi.longitude],
    title: poi.name,
    subtitle: `Stop ${index + 1}`,
    iconType: 'numbered',
    number: index + 1,
    originalData: poi
  };
}
