import { usuarios } from './usuarios';

export interface Route {
  id: string;
  name: string;
  description?: string;
  category?: string;
  duration?: string; // e.g., "2 días", "5 horas"
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number; // en minutos
  estimatedDistance?: number; // en kilómetros
  providers: usuarios[];
  color?: string; // Color para diferenciar rutas en el mapa
  icon?: string; // Icono representativo
  tags?: string[]; // e.g., ["aventura", "naturaleza", "cultural"]
  startLocation?: [number, number]; // Coordenadas de inicio
  endLocation?: [number, number]; // Coordenadas de fin
  isActive?: boolean;
  createdAt?: Date;
  rating?: number; // Calificación promedio de la ruta
  totalReviews?: number;
}

export interface RouteDisplayOptions {
  showRouteInfo: boolean;
  showProviderCarousel: boolean;
  showProviderCard: boolean;
  showRouteLines: boolean;
  compactMode: boolean;
  allowRouteSelection: boolean;
}

export interface RouteSelectionEvent {
  route: Route;
  selectedProvider?: usuarios;
  action: 'route_selected' | 'provider_selected' | 'route_expanded' | 'route_collapsed';
}