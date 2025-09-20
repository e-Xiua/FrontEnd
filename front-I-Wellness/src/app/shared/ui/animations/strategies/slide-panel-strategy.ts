import { ProviderDisplayStrategy } from "../model/display-strategy";

export class SlidePanelStrategy implements ProviderDisplayStrategy {
  show(component: any, providerData: any): void {
    component.ngZone.run(() => {
      component.selectedProviderId = providerData.id;
      component.showProviderCard = true;

      // Replace placeholder with full mapping
      component.placeData = {
        id: providerData.id,
        name: providerData.nombre_empresa,  // Flat, from raw.nombre_empresa
        contactName: providerData.nombre || 'N/A',  // If not present, default; extend providerData if needed
        email: providerData.correo || 'N/A',  // If not present, default; extend providerData if needed
        foto: providerData.foto,  // May be undefined; use a fallback if needed
        category: providerData.categoria || 'N/A',  // Flat, from raw.categoria
        rating: providerData.rating || 4.5,
        totalReviews: providerData.totalReviews || 0,
        address: providerData.address || 'N/A',  // Flat, from raw.direccion
        hours: providerData.hours || 'N/A',  // Flat, from raw.horario
        description: providerData.description || 'N/A',  // Flat, from raw.descripcion
        phone: providerData.telefono || 'N/A',  // Flat, from raw.telefono
        companyPhone: providerData.telefonoEmpresa || 'N/A',  // Flat, from raw.telefonoEmpresa
        cargoContacto: providerData.cargoContacto || 'N/A',  // Flat, if present in raw
        certificadosCalidad: providerData.certificadosCalidad || null,  // Flat, if present
        identificacionFiscal: providerData.identificacionFiscal || null,  // Flat, if present
        licenciasPermisos: providerData.licenciasPermisos || null  // Flat, if present
      };

      component.servicioService.obtenerServiciosPorProveedor(providerData.id).subscribe({
        next: (servicios: any) => {
          component.services = servicios.map((s: any) => ({
            image: s.foto || 'https://via.placeholder.com/400',
            title: s.nombre,
            description: s.descripcion,
            schedule: s.horario,
            price: s.precio || '',
            duration: s.duracion || ''
          }));
          component.reviews = [];
          component.cdr.markForCheck(); // If using OnPush
        },
        error: (err: any) => console.error('Error al obtener servicios', err)
      });

      setTimeout(() => component.cdr.markForCheck(), 0); // Ensure immediate update after setting placeData
    });
  }

  hide(component: any): void {
    component.ngZone.run(() => {
      component.showProviderCard = false;
      component.selectedProviderId = null;
      component.cdr.markForCheck(); // If using OnPush
    });
  }
}
