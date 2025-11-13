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

	console.log('🔍 mapUsuarioToExtendedPlaceData - Input user:', user);
	console.log('🔍 proveedorInfo:', user.proveedorInfo);

	const proveedorInfo = user.proveedorInfo ?? {};
	const normalizedId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
	
	// Provider name - try multiple field variations
	const providerName = proveedorInfo.nombre_empresa
		?? proveedorInfo.nombreEmpresa
		?? proveedorInfo.razonSocial
		?? user.nombre
		?? placeDataDefaults.contactName;

	// Categories - try multiple field variations
	const categories = Array.isArray(proveedorInfo.categorias)
		? proveedorInfo.categorias.filter(Boolean)
		: Array.isArray(proveedorInfo.categories)
		? proveedorInfo.categories.filter(Boolean)
		: proveedorInfo.categoria
			? [proveedorInfo.categoria]
			: [];

	// Total reviews - try multiple field variations
	const totalReviews = typeof proveedorInfo.total_resenas === 'number'
		? proveedorInfo.total_resenas
		: typeof proveedorInfo.totalResenas === 'number'
		? proveedorInfo.totalResenas
		: Array.isArray(proveedorInfo.resenas)
			? proveedorInfo.resenas.length
			: 0;

	// Contact name - try multiple field variations
	const contactName = user.nombre 
		?? proveedorInfo.nombreContacto
		?? proveedorInfo.nombre_contacto
		?? proveedorInfo.cargo_contacto 
		?? proveedorInfo.cargoContacto
		?? placeDataDefaults.contactName;
	
	const photoSeed = contactName || providerName;
	const foto = user.foto
		?? proveedorInfo.foto
		?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(photoSeed)}`;

	// Phone - try multiple field variations including top-level
	const phone = proveedorInfo.telefono 
		?? placeDataDefaults.phone;
	
	// Company phone - try multiple field variations
	const companyPhone = proveedorInfo.telefono_empresa 
		?? proveedorInfo.telefonoEmpresa
		?? proveedorInfo.telefono 
		?? placeDataDefaults.companyPhone;

	// Email - try multiple field variations
	const email = user.correo 
		?? proveedorInfo.correo
		?? proveedorInfo.email
		?? placeDataDefaults.correo;

	// Cargo - try multiple field variations
	const cargoContacto = proveedorInfo.cargo_contacto 
		?? proveedorInfo.cargoContacto
		?? placeDataDefaults.cargoContacto;

	// Address - try multiple field variations
	const address = proveedorInfo.direccion 
		?? proveedorInfo.address
		?? placeDataDefaults.address;

	// Hours - try multiple field variations
	const hours = proveedorInfo.horario 
		?? proveedorInfo.horarios
		?? proveedorInfo.hours
		?? placeDataDefaults.hours;

	// Description - try multiple field variations
	const description = proveedorInfo.descripcion 
		?? proveedorInfo.description
		?? placeDataDefaults.description;

	// Certifications - try multiple field variations
	const certificadosCalidad = proveedorInfo.certificados_calidad 
		?? proveedorInfo.certificadosCalidad
		?? proveedorInfo.certificaciones
		?? null;

	// Fiscal ID - try multiple field variations
	const identificacionFiscal = proveedorInfo.identificacion_fiscal 
		?? proveedorInfo.identificacionFiscal
		?? proveedorInfo.cedulaJuridica
		?? null;

	// Licenses - try multiple field variations
	const licenciasPermisos = proveedorInfo.licencias_permisos 
		?? proveedorInfo.licenciasPermisos
		?? proveedorInfo.licencias
		?? null;

	const result: ExtendedPlaceData = {
		id: Number.isNaN(normalizedId) ? 0 : normalizedId,
		name: providerName,
		contactName,
		correo: email,
		foto,
		category: categories[0] ?? placeDataDefaults.category,
		rating: coerceNumber(proveedorInfo.promedioCalificacion ?? proveedorInfo.rating ?? proveedorInfo.calificacion) ?? 0,
		totalReviews,
		address,
		hours,
		description,
		phone,
		companyPhone,
		cargoContacto,
		certificadosCalidad: Array.isArray(certificadosCalidad) ? certificadosCalidad : null,
		identificacionFiscal,
		licenciasPermisos: Array.isArray(licenciasPermisos) ? licenciasPermisos : null,
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

	console.log('✅ mapUsuarioToExtendedPlaceData - Output:', result);
	console.log('📋 Mapped fields check:', {
		name: result.name,
		contactName: result.contactName,
		email: result.correo,
		phone: result.phone,
		companyPhone: result.companyPhone,
		address: result.address,
		hours: result.hours,
		description: result.description,
		cargoContacto: result.cargoContacto,
		certificadosCalidad: result.certificadosCalidad,
		identificacionFiscal: result.identificacionFiscal,
		licenciasPermisos: result.licenciasPermisos
	});
	
	return result;
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
