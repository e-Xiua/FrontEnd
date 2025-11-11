import { BackendEnrichedProviderDTO, BackendProviderDTO } from "../models/backend-provider.dto";
import { ExtendedPlaceData, placeDataDefaults } from "../models/place-data.model";
import { EnrichedProviderData, Provider } from "../models/provider.models";
import { usuarios } from "../models/usuarios";

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

export function mapUsuarioToExtendedPlaceData(user: usuarios): ExtendedPlaceData {
	if (!user) {
		throw new Error('mapUsuarioToExtendedPlaceData: user is required');
	}

	const proveedorInfo = user.proveedorInfo ?? {};
	const normalizedId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
	const providerName = proveedorInfo.nombre_empresa
		?? proveedorInfo.nombreEmpresa
		?? user.nombre
		?? placeDataDefaults.contactName;

	const categories = Array.isArray(proveedorInfo.categorias)
		? proveedorInfo.categorias.filter(Boolean)
		: proveedorInfo.categoria
			? [proveedorInfo.categoria]
			: [];

	const totalReviews = typeof proveedorInfo.total_resenas === 'number'
		? proveedorInfo.total_resenas
		: Array.isArray(proveedorInfo.resenas)
			? proveedorInfo.resenas.length
			: 0;

	const contactName = user.nombre ?? proveedorInfo.cargo_contacto ?? placeDataDefaults.contactName;
	const photoSeed = contactName || providerName;
	const foto = user.foto
		?? proveedorInfo.foto
		?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(photoSeed)}`;

	return {
		id: Number.isNaN(normalizedId) ? 0 : normalizedId,
		name: providerName,
		contactName,
		correo: user.correo ?? placeDataDefaults.correo,
		foto,
		category: categories[0] ?? placeDataDefaults.category,
		rating: coerceNumber(proveedorInfo.promedioCalificacion ?? proveedorInfo.rating) ?? 0,
		totalReviews,
		address: proveedorInfo.direccion ?? placeDataDefaults.address,
		hours: proveedorInfo.horario ?? placeDataDefaults.hours,
		description: proveedorInfo.descripcion ?? placeDataDefaults.description,
		phone: proveedorInfo.telefono ?? placeDataDefaults.phone,
		companyPhone: proveedorInfo.telefono_empresa ?? proveedorInfo.telefono ?? placeDataDefaults.companyPhone,
		cargoContacto: proveedorInfo.cargo_contacto ?? placeDataDefaults.cargoContacto,
		certificadosCalidad: proveedorInfo.certificados_calidad ?? null,
		identificacionFiscal: proveedorInfo.identificacion_fiscal ?? null,
		licenciasPermisos: proveedorInfo.licencias_permisos ?? null,
		services: Array.isArray(proveedorInfo.servicios) ? proveedorInfo.servicios : [],
		reviews: Array.isArray(proveedorInfo.resenas) ? proveedorInfo.resenas : [],
		categories,
		averageCost: coerceNumber(
			proveedorInfo.promedioCosto
				?? proveedorInfo.costo_promedio
				?? proveedorInfo.costoPromedio
		) ?? undefined,
		averageVisitDuration: coerceNumber(
			proveedorInfo.promedioDuracion
				?? proveedorInfo.tiempo_promedio
				?? proveedorInfo.tiempoPromedio
		) ?? undefined,
		provider: {
			id: Number.isNaN(normalizedId) ? 0 : normalizedId,
			foto: user.foto ?? null,
			correo: user.correo ?? null,
			nombre: user.nombre ?? null,
			nombre_empresa: providerName,
			proveedorInfo
		}
	};
}

	function coerceNumber(value: unknown): number | undefined {
		if (typeof value === 'number' && !Number.isNaN(value)) {
			return value;
		}

		if (typeof value === 'string' && value.trim().length > 0) {
			const parsed = Number(value);
			if (!Number.isNaN(parsed)) {
				return parsed;
			}
		}

		return undefined;
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
