import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ChatProvider, ChatService } from '../models/chat';
import { usuarios } from '../models/usuarios';

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterBy?: string;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProviderMapperService {

  constructor() {}

  /**
   * Mapea un usuario del backend a ChatProvider para el sistema de chat
   */
  mapUsuarioToChatProvider(usuario: usuarios): ChatProvider {
    return {
      // Propiedades básicas del usuario
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.correo,
      telefono: usuario.proveedorInfo?.telefono || '',
      cedula: usuario.proveedorInfo?.cedula || '',
      proveedorInfo: usuario.proveedorInfo ? {
        nombreEmpresa: usuario.proveedorInfo.nombreEmpresa,
        descripcion: usuario.proveedorInfo.descripcion,
        latitud: usuario.proveedorInfo.latitud,
        longitud: usuario.proveedorInfo.longitud,
        telefono: usuario.proveedorInfo.telefono,
        email: usuario.proveedorInfo.email,
        sitioWeb: usuario.proveedorInfo.sitioWeb
      } : undefined,

      // Propiedades específicas del chat
      contactName: usuario.proveedorInfo?.nombreEmpresa || usuario.nombre,
      photo: usuario.foto || this.generateProviderAvatar(usuario),
      rating: this.calculateProviderRating(usuario),
      totalReviews: this.generateRandomReviewCount(),
      services: this.mapProviderServices(usuario),
      isOnline: this.generateRandomOnlineStatus(),
      lastSeen: this.generateRandomLastSeen()
    };
  }

  /**
   * Mapea múltiples usuarios a ChatProviders
   */
  mapUsuariosToChatProviders(usuarios: usuarios[]): ChatProvider[] {
    return usuarios
      .filter(usuario => usuario.proveedorInfo) // Solo proveedores
      .map(usuario => this.mapUsuarioToChatProvider(usuario));
  }

  /**
   * Pagina una lista de elementos
   */
  paginateItems<T>(
    items: T[],
    options: PaginationOptions
  ): PaginatedResult<T> {
    const { page, pageSize, sortBy, sortOrder, searchTerm } = options;

    // Filtrar por término de búsqueda si existe
    let filteredItems = items;
    if (searchTerm && searchTerm.trim()) {
      filteredItems = this.filterItemsBySearchTerm(items, searchTerm);
    }

    // Ordenar si se especifica
    if (sortBy) {
      filteredItems = this.sortItems(filteredItems, sortBy, sortOrder || 'asc');
    }

    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      totalItems,
      currentPage: page,
      totalPages,
      pageSize,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  /**
   * Crea una página paginada observable
   */
  createPaginatedObservable<T>(
    items: T[],
    options: PaginationOptions
  ): Observable<PaginatedResult<T>> {
    return of(this.paginateItems(items, options));
  }

  /**
   * Genera servicios mock para un proveedor
   */
  private mapProviderServices(usuario: usuarios): ChatService[] {
    const serviceTemplates = [
      { name: 'Masaje Relajante', category: 'Spa', duration: 60, basePrice: 45000 },
      { name: 'Tour Canopy', category: 'Aventura', duration: 120, basePrice: 25000 },
      { name: 'Tratamiento Facial', category: 'Belleza', duration: 45, basePrice: 35000 },
      { name: 'Yoga al Amanecer', category: 'Bienestar', duration: 90, basePrice: 15000 },
      { name: 'Tour Gastronómico', category: 'Gastronomía', duration: 180, basePrice: 55000 },
      { name: 'Rafting', category: 'Aventura', duration: 240, basePrice: 65000 },
    ];

    // Generar entre 1-4 servicios aleatorios para cada proveedor
    const serviceCount = Math.floor(Math.random() * 4) + 1;
    const shuffled = [...serviceTemplates].sort(() => 0.5 - Math.random());
    const selectedServices = shuffled.slice(0, serviceCount);

    return selectedServices.map((template, index) => ({
      id: usuario.id * 100 + index,
      name: template.name,
      description: `${template.name} profesional ofrecido por ${usuario.proveedorInfo?.nombreEmpresa || usuario.nombre}`,
      price: template.basePrice + Math.floor(Math.random() * 10000), // Variación de precio
      currency: 'CRC',
      duration: template.duration,
      category: template.category,
      available: Math.random() > 0.2 // 80% disponible
    }));
  }

  /**
   * Genera avatar para proveedor
   */
  private generateProviderAvatar(usuario: usuarios): string {
    const seed = usuario.nombre || `provider${usuario.id}`;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  }

  /**
   * Calcula rating del proveedor (mock)
   */
  private calculateProviderRating(usuario: usuarios): number {
    // Generar rating entre 3.5 y 5.0
    return Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
  }

  /**
   * Genera número aleatorio de reseñas
   */
  private generateRandomReviewCount(): number {
    return Math.floor(Math.random() * 200) + 10;
  }

  /**
   * Genera estado online aleatorio
   */
  private generateRandomOnlineStatus(): boolean {
    return Math.random() > 0.3; // 70% online
  }

  /**
   * Genera última vez visto
   */
  private generateRandomLastSeen(): Date | undefined {
    const now = new Date();
    const hoursAgo = Math.floor(Math.random() * 24);
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  }

  /**
   * Filtra elementos por término de búsqueda
   */
  private filterItemsBySearchTerm<T>(items: T[], searchTerm: string): T[] {
    const term = searchTerm.toLowerCase().trim();

    return items.filter(item => {
      if (item && typeof item === 'object') {
        return this.searchInObject(item, term);
      }
      return String(item).toLowerCase().includes(term);
    });
  }

  /**
   * Busca término en propiedades del objeto
   */
  private searchInObject(obj: any, term: string): boolean {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string' && value.toLowerCase().includes(term)) {
          return true;
        }
        if (typeof value === 'object' && value !== null) {
          if (this.searchInObject(value, term)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Ordena elementos por propiedad
   */
  private sortItems<T>(items: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] {
    return [...items].sort((a, b) => {
      const aValue = this.getNestedProperty(a, sortBy);
      const bValue = this.getNestedProperty(b, sortBy);

      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }

      return sortOrder === 'desc' ? comparison * -1 : comparison;
    });
  }

  /**
   * Obtiene propiedad anidada de un objeto
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Crea opciones de paginación por defecto
   */
  createDefaultPaginationOptions(): PaginationOptions {
    return {
      page: 1,
      pageSize: 10,
      sortBy: 'nombre',
      sortOrder: 'asc'
    };
  }

  /**
   * Actualiza opciones de paginación
   */
  updatePaginationOptions(
    current: PaginationOptions,
    updates: Partial<PaginationOptions>
  ): PaginationOptions {
    return { ...current, ...updates };
  }
}
