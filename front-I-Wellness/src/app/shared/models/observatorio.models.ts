export interface ClimaCurrent {
  success: boolean;
  error?: string;
  data?: {
    temperature: number;
    feels_like: number;
    humidity: number;
    description: string;
    wind_speed: number;
    pressure?: number;
    visibility?: number;
    clouds?: number;
    icon?: string;
    location?: string;
    country?: string;
  };
  timestamp?: string;
}

export interface ClimaForecast {
  success: boolean;
  error?: string;
  forecast: ForecastDay[];
  location?: string;
}

export interface ForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  description: string;
  humidity: number;
  wind_speed: number;
  precipitation_chance: number;
  icon?: string;
  uv_index?: number;
}

export interface ClimaTourismMetrics {
  success: boolean;
  error?: string;
  metrics: {
    tourism_score: number;
    recommendations: string[];
    best_hours?: string[];
    activities_suitability?: {
      outdoor: number;
      water_sports: number;
      hiking: number;
      relaxation: number;
    };
  };
}

// ============================================================
// MODELOS PARA IMN - Instituto Meteorológico Nacional
// ============================================================

export interface IMNCurrent {
  success: boolean;
  error?: string;
  data?: {
    station: string;
    location: string;
    temperature: number;
    humidity: number;
    wind_speed: number;
    wind_direction: string;
    pressure: number;
    precipitation: number;
    uv_index: number;
    visibility: number;
    conditions: string;
  };
  timestamp?: string;
}

export interface IMNHourly {
  success: boolean;
  error?: string;
  hourly_readings: HourlyReading[];
  station?: string;
}

export interface HourlyReading {
  hour: string;
  date: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  uv_index: number;
  conditions: string;
}

export interface IMNDaily {
  success: boolean;
  error?: string;
  daily_summary?: {
    date: string;
    temp_max: number;
    temp_min: number;
    temp_avg: number;
    humidity_avg: number;
    total_precipitation: number;
    max_uv_index: number;
    predominant_conditions: string;
  };
}

export interface IMNInsights {
  success: boolean;
  error?: string;
  insights: {
    recommendations: string[];
    alerts: Alert[];
    best_time_to_visit?: string;
    tourism_conditions?: string;
  };
}

export interface Alert {
  type: string;
  severity: string;
  message: string;
  icon?: string;
}

// ============================================================
// MODELOS PARA ÍNDICE UV
// ============================================================

export interface UVCurrent {
  success: boolean;
  error?: string;
  data?: {
    uv_index: number;
    level: string;
    risk_category: string;
    color: string;
    recommendations: string[];
    protection_needed: boolean;
    safe_exposure_time?: number;
  };
  data_source?: string;
  timestamp?: string;
}

export interface UVForecast {
  success: boolean;
  error?: string;
  forecast?: UVForecastHour[];
  daily_peak?: {
    time: string;
    uv_index: number;
    level: string;
  };
  data_source?: string;
}

export interface UVForecastHour {
  time: string;
  date?: string;
  uv_index: number;
  level: string;
  risk_category: string;
  color: string;
}

export interface UVInsights {
  success: boolean;
  error?: string;
  insights: {
    recommendations: string[];
    best_outdoor_hours?: string[];
    peak_uv_times?: string[];
    activities_advice?: {
      morning: string;
      midday: string;
      afternoon: string;
    };
  };
  data_source?: string;
}

// ============================================================
// MODELOS PARA OVSICORI - VOLCÁN ARENAL
// ============================================================

export interface VolcanoStatus {
  success: boolean;
  error?: string;
  data?: {
    volcano_name: string;
    status: string;
    alert_level: string;
    last_update: string;
    activity_description: string;
    tourism_safe: boolean;
    restrictions?: string[];
  };
  timestamp?: string;
  extended_info?: {
    volcano_name?: string;
    location?: string;
    altitude_m?: number;
    type?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
    current_status?: string;
    last_major_eruption?: string;
    years_inactive?: number;
    alert_level?: number;
    alert_name?: string;
    alert_emoji?: string;
    alert_description?: string;
    tourist_impact?: string;
    is_safe_for_tourism?: boolean;
    recommendations?: string[];
    historical_note?: string;
    monitoring_authority?: string;
    last_update?: string;
    source?: string;
  };
}

export interface VolcanoSeismic {
  success: boolean;
  error?: string;
  seismic_events: SeismicEvent[];
  summary?: {
    total_events: number;
    max_magnitude: number;
    avg_magnitude: number;
    period: string;
  };
}

export interface SeismicEvent {
  date: string;
  time: string;
  magnitude: number;
  depth: number;
  location: string;
  distance_from_arenal?: number;
  felt?: boolean;
}

export interface VolcanoInsights {
  success: boolean;
  error?: string;
  insights: {
    tourism_impact: string;
    recommendations: string[];
    safety_status: string;
    visitor_guidelines?: string[];
    monitoring_info?: string;
  };
}

// ============================================================
// MODELOS PARA ICT - EVENTOS Y NOTICIAS
// ============================================================

export interface EventsRecent {
  success: boolean;
  error?: string;
  news: NewsArticle[];
  total?: number;
  last_updated?: string;
}

export interface EventsWellness {
  success: boolean;
  error?: string;
  wellness_news: NewsArticle[];
  total?: number;
  categories?: string[];
}

export interface EventsLaFortuna {
  success: boolean;
  error?: string;
  la_fortuna_news: NewsArticle[];
  total?: number;
  relevance_score?: number;
}

export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  date: string;
  category?: string;
  image_url?: string;
  source: string;
  relevance_score?: number;
  tags?: string[];
}

export interface EventsInsights {
  success: boolean;
  error?: string;
  insights: {
    trending_topics: string[];
    upcoming_events: UpcomingEvent[];
    wellness_trends?: string[];
    tourism_highlights?: string[];
  };
}

export interface UpcomingEvent {
  name: string;
  date: string;
  location: string;
  description: string;
  category: string;
  url?: string;
}

// ============================================================
// MODELOS AUXILIARES
// ============================================================

export interface ObservatorioSummary {
  weather: {
    current: ClimaCurrent;
    forecast: ClimaForecast;
    metrics: ClimaTourismMetrics;
  };
  uv: {
    current: UVCurrent;
    forecast: UVForecast;
    insights: UVInsights;
  };
  volcano: {
    status: VolcanoStatus;
    seismic: VolcanoSeismic;
    insights: VolcanoInsights;
  };
  events: {
    recent: EventsRecent;
    wellness: EventsWellness;
    laFortuna: EventsLaFortuna;
    insights: EventsInsights;
  };
  lastUpdate: Date;
}
