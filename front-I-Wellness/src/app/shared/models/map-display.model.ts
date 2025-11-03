export interface MapDisplayItem {
  id: number | string; // Unique ID for the item
  position: [number, number]; // [lat, lng]
  title: string; // Name to display
  subtitle?: string; // e.g., "Stop 1" or category
  iconType: 'default' | 'numbered';
  number?: number; // For numbered icons in a sequence
  originalData: any; // The original EnrichedProviderData or OptimizedPOI
}
