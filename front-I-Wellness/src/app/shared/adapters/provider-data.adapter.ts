import { BackendEnrichedProviderDTO, BackendProviderDTO } from "../models/backend-provider.dto";
import { EnrichedProviderData, Provider } from "../models/provider.models";

/**
 * Normalize a backend enriched provider payload into EnrichedProviderData
 * - Flattens proveedorInfo over provider
 * - Parses coordinates to numbers
 * - Ensures contact fields are on provider
 * - Applies safe defaults for averages and categories
 */
export function normalizeEnrichedProvider(dto: BackendEnrichedProviderDTO): EnrichedProviderData {
	const provider = mergeProviderInfo(dto.provider);

	const normalizedProvider: Provider = {
		id: provider.id,
    foto: provider.foto,
    correo: provider.correo,
		nombre_empresa: provider.nombre_empresa,
		coordenadaX: provider.coordenadaX,
		coordenadaY: provider.coordenadaY,
		cargoContacto: provider.cargoContacto,
		telefono: provider.telefono,
		telefonoEmpresa: provider.telefonoEmpresa
	};

	return {
		provider: normalizedProvider,
		services: Array.isArray(dto.services) ? dto.services : [],
		averageCost: typeof dto.averageCost === 'number' && !Number.isNaN(dto.averageCost) ? dto.averageCost : 0,
		averageVisitDuration: typeof dto.averageVisitDuration === 'number' && !Number.isNaN(dto.averageVisitDuration) ? dto.averageVisitDuration : 30,
		categories: Array.isArray(dto.categories) ? dto.categories.filter(Boolean) as string[] : []
	};
}

/**
 * Build a normalized fallback EnrichedProviderData when backend enrichment fails
 */
export function buildFallbackEnrichedProvider(raw: any): EnrichedProviderData {
	// If it's already enriched-like, try to reuse its provider
	const rawProvider: BackendProviderDTO = (raw && raw.provider) ? raw.provider : raw;
	const provider = mergeProviderInfo(rawProvider);

	const normalizedProvider: Provider = {
		id: provider.id,
    foto: provider.foto,
		nombre_empresa: provider.nombre_empresa,
		coordenadaX: provider.coordenadaX,
		coordenadaY: provider.coordenadaY,
		cargoContacto: provider.cargoContacto,
		telefono: provider.telefono,
		telefonoEmpresa: provider.telefonoEmpresa
	};

	return {
		provider: normalizedProvider,
		services: [],
		averageCost: 0,
		averageVisitDuration: 30,
		categories: []
	};
}

// Helpers

function mergeProviderInfo(raw: BackendProviderDTO): {
	id: number;
  foto?: string;
  correo?: string;
	nombre_empresa: string;
	coordenadaX: number;
	coordenadaY: number;
	cargoContacto?: string;
	telefono?: string;
	telefonoEmpresa?: string;
} {
	const top = raw || ({} as BackendProviderDTO);
	const info = (top && top.proveedorInfo) ? top.proveedorInfo : undefined;

	// Determine id (id over idProveedor, and parse string)
	const idRaw: any = top.id ?? top.idProveedor ?? info?.id ?? 0;
	const id = typeof idRaw === 'string' ? parseInt(idRaw, 10) : (idRaw ?? 0);

	// Determine company name
	const nombre_empresa =
		(top as any).nombre_empresa ?? (top as any).nombreEmpresa ?? (top as any).nombre ??
		(info as any)?.nombre_empresa ?? (info as any)?.nombreEmpresa ?? 'Unknown';

	// Coordinates can be in top or info and as strings
	const coordXRaw: any = (top as any).coordenadaX ?? (info as any)?.coordenadaX ?? 0;
	const coordYRaw: any = (top as any).coordenadaY ?? (info as any)?.coordenadaY ?? 0;
	const coordenadaX = typeof coordXRaw === 'string' ? parseFloat(coordXRaw) : (coordXRaw ?? 0);
	const coordenadaY = typeof coordYRaw === 'string' ? parseFloat(coordYRaw) : (coordYRaw ?? 0);

	// Contacts prefer nested info when present
	const cargoContacto = (info as any)?.cargoContacto ?? (top as any).cargoContacto ?? undefined;
	const telefono = (info as any)?.telefono ?? (top as any).telefono ?? undefined;
	const telefonoEmpresa = (info as any)?.telefonoEmpresa ?? (top as any).telefonoEmpresa ?? undefined;

	return {
		id: Number.isNaN(id) ? 0 : id,
		nombre_empresa,
    foto: top.foto ?? undefined,
    correo: top.correo ?? undefined,
		coordenadaX: Number.isNaN(coordenadaX) ? 0 : coordenadaX,
		coordenadaY: Number.isNaN(coordenadaY) ? 0 : coordenadaY,
		cargoContacto,
		telefono,
		telefonoEmpresa
	};
}
