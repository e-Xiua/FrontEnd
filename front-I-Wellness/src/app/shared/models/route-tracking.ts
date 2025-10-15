export interface RoutePoint {
  position: [number, number];
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface RouteSegment {
  id: string;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  coordinates: [number, number][];
  distance?: number;
  duration?: number;
  color?: string;
  weight?: number;
  opacity?: number;
}

export interface UserRoute {
  userId: string;
  segments: RouteSegment[];
  currentPosition: RoutePoint;
  isActive: boolean;
  startTime: Date;
  lastUpdateTime: Date;
}

export interface RouteDisplayOptions {
  showCurrentRoute: boolean;
  showHistoricalRoutes: boolean;
  routeColor: string;
  routeWeight: number;
  routeOpacity: number;
  showStartMarker: boolean;
  showEndMarker: boolean;
  showCurrentPositionMarker: boolean;
}

export interface RouteTrackingConfig {
  trackingInterval: number; // milliseconds
  minDistanceThreshold: number; // meters
  maxPointsToKeep: number;
  autoCleanupOldRoutes: boolean;
  maxRouteAge: number; // hours
}
