import { OptimizationResult, OptimizedPOI } from '../models/optimization-job.models';
import { EnrichedProviderData } from '../models/provider.models';
import { Route } from '../models/route';
import { usuarios } from '../models/usuarios';

/**
 * Clone helper to avoid mutating incoming optimization result instances.
 */
function cloneResult(result: OptimizationResult): OptimizationResult {
  return {
    ...result,
    optimizedSequence: result.optimizedSequence.map(poi => ({ ...poi }))
  };
}

/**
 * Enrich an optimization result with provider metadata gathered from backend enrichment.
 * Returns a new OptimizationResult instance that preserves the same identity while augmenting
 * each OptimizedPOI with the corresponding EnrichedProviderData block.
 */
export function enrichOptimizationResult(
  rawResult: OptimizationResult,
  providers: EnrichedProviderData[]
): OptimizationResult {
  const providersById = new Map<number, EnrichedProviderData>();
  for (const provider of providers) {
    providersById.set(provider.provider.id, provider);
  }

  const result = cloneResult(rawResult);

  result.optimizedSequence = result.optimizedSequence.map((poi: OptimizedPOI) => {
    const providerData = providersById.get(Number(poi.poiId));

    if (!providerData) {
      return {
        ...poi,
        providerData: undefined as EnrichedProviderData | undefined
      };
    }

    return {
      ...poi,
      name: providerData.provider.nombre_empresa,
      latitude: providerData.provider.coordenadaX,
      longitude: providerData.provider.coordenadaY,
      category: providerData.categories.length > 0 ? providerData.categories[0] : poi.category,
      cost: providerData.averageCost ?? poi.cost,
      providerData
    };
  });

  return result;
}

function mapProviderDataToUsuario(enriched: EnrichedProviderData): usuarios {
  return {
    id: enriched.provider.id,
    nombre: enriched.provider.nombre_empresa,
    correo: enriched.provider.correo ?? '',
    foto: enriched.provider.foto ?? '',
    rol: undefined,
    proveedorInfo: enriched
  };
}

/**
 * Convert an enriched optimization result into the Route view model expected by the
 * route listing components. Assumes the incoming result has been enriched (i.e. each
 * POI already carries providerData).
 */
export function mapOptimizationResultToRoute(result: OptimizationResult): Route {
  const providersMap = new Map<number, usuarios>();
  const providerCategories = new Set<string>();
  let costAccumulator = 0;
  let costSamples = 0;

  for (const poi of result.optimizedSequence) {
    const providerData = poi.providerData as EnrichedProviderData | undefined;
    if (!providerData) {
      continue;
    }
    if (!providersMap.has(providerData.provider.id)) {
      providersMap.set(providerData.provider.id, mapProviderDataToUsuario(providerData));
    }

    for (const category of providerData.categories ?? []) {
      if (category) {
        providerCategories.add(category);
      }
    }

    if (typeof providerData.averageCost === 'number' && !Number.isNaN(providerData.averageCost)) {
      costAccumulator += providerData.averageCost;
      costSamples += 1;
    }
  }

  const providersArray = Array.from(providersMap.values());

  const metadata = (result as any).metadata ?? {};
  const name: string = metadata.routeName || metadata.name || `Ruta optimizada ${result.optimizedRouteId ?? ''}`;
  const description: string | undefined = metadata.description;
  const tags = Array.from(providerCategories.values());
  const category: string | undefined = metadata.category || (tags.length > 0 ? tags[0] : undefined);
  const averageCost = costSamples > 0 ? costAccumulator / costSamples : undefined;

  return {
    id: result.optimizedRouteId,
    name,
    description,
    category,
    estimatedTime: result.totalTimeMinutes,
    estimatedDistance: result.totalDistanceKm,
    tags,
    providerCategories: tags,
    averageProviderCost: averageCost,
    providers: providersArray,
    optimizationResult: result
  };
}
