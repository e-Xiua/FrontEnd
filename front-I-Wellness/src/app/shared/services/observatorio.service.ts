import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import type { 
  ClimaCurrent, 
  ClimaForecast, 
  ClimaTourismMetrics,
  IMNCurrent,
  IMNHourly,
  IMNDaily,
  IMNInsights,
  UVCurrent,
  UVForecast,
  UVInsights,
  VolcanoStatus,
  VolcanoSeismic,
  VolcanoInsights,
  EventsRecent,
  EventsWellness,
  EventsLaFortuna,
  EventsInsights
} from '../models/observatorio.models.js';

@Injectable({
  providedIn: 'root'
})
export class ObservatorioService {
  private baseUrl = 'http://localhost:8090/api';

  constructor(private http: HttpClient) { }

  // ============================================================
  // CLIMA - Weather APIs
  // ============================================================

  /**
   * Obtiene el clima actual para una ubicación
   * @param lat Latitud (opcional, por defecto La Fortuna)
   * @param lon Longitud (opcional, por defecto La Fortuna)
   * @param city Ciudad (opcional)
   */
  getCurrentWeather(lat?: number, lon?: number, city?: string): Observable<ClimaCurrent> {
    let params = new HttpParams();
    if (lat) params = params.set('lat', lat.toString());
    if (lon) params = params.set('lon', lon.toString());
    if (city) params = params.set('city', city);

    return this.http.get<ClimaCurrent>(`${this.baseUrl}/weather/current`, { params })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo clima actual:', error);
          return of(this.getDefaultWeatherCurrent());
        })
      );
  }

  /**
   * Obtiene el pronóstico del clima
   * @param lat Latitud (opcional)
   * @param lon Longitud (opcional)
   * @param days Días de pronóstico (por defecto 5)
   */
  getWeatherForecast(lat?: number, lon?: number, days: number = 5): Observable<ClimaForecast> {
    let params = new HttpParams();
    if (lat) params = params.set('lat', lat.toString());
    if (lon) params = params.set('lon', lon.toString());
    params = params.set('days', days.toString());

    return this.http.get<ClimaForecast>(`${this.baseUrl}/weather/forecast`, { params })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo pronóstico:', error);
          return of(this.getDefaultWeatherForecast());
        })
      );
  }

  /**
   * Obtiene métricas turísticas del clima
   */
  getWeatherTourismMetrics(lat?: number, lon?: number): Observable<ClimaTourismMetrics> {
    let params = new HttpParams();
    if (lat) params = params.set('lat', lat.toString());
    if (lon) params = params.set('lon', lon.toString());

    return this.http.get<ClimaTourismMetrics>(`${this.baseUrl}/weather/tourism-metrics`, { params })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo métricas turísticas:', error);
          return of(this.getDefaultTourismMetrics());
        })
      );
  }

  // ============================================================
  // IMN - Instituto Meteorológico Nacional
  // ============================================================

  /**
   * Obtiene datos actuales del IMN Costa Rica
   */
  getIMNCurrent(): Observable<IMNCurrent> {
    return this.http.get<IMNCurrent>(`${this.baseUrl}/imn/current`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo datos IMN:', error);
          return of(this.getDefaultIMNCurrent());
        })
      );
  }

  /**
   * Obtiene datos horarios del IMN
   * @param hours Horas a obtener (por defecto 24)
   */
  getIMNHourly(hours: number = 24): Observable<IMNHourly> {
    const params = new HttpParams().set('hours', hours.toString());
    return this.http.get<IMNHourly>(`${this.baseUrl}/imn/hourly`, { params })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo datos horarios IMN:', error);
          return of(this.getDefaultIMNHourly());
        })
      );
  }

  /**
   * Obtiene resumen diario del IMN
   */
  getIMNDaily(): Observable<IMNDaily> {
    return this.http.get<IMNDaily>(`${this.baseUrl}/imn/daily`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo resumen diario IMN:', error);
          return of(this.getDefaultIMNDaily());
        })
      );
  }

  /**
   * Obtiene insights turísticos del IMN
   */
  getIMNInsights(): Observable<IMNInsights> {
    return this.http.get<IMNInsights>(`${this.baseUrl}/imn/insights`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo insights IMN:', error);
          return of(this.getDefaultIMNInsights());
        })
      );
  }

  // ============================================================
  // ÍNDICE UV
  // ============================================================

  /**
   * Obtiene análisis actual del índice UV
   */
  getUVCurrent(): Observable<UVCurrent> {
    return this.http.get<UVCurrent>(`${this.baseUrl}/uv/current`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo UV actual:', error);
          return of(this.getDefaultUVCurrent());
        })
      );
  }

  /**
   * Obtiene pronóstico del índice UV
   */
  getUVForecast(): Observable<UVForecast> {
    return this.http.get<UVForecast>(`${this.baseUrl}/uv/forecast`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo pronóstico UV:', error);
          return of(this.getDefaultUVForecast());
        })
      );
  }

  /**
   * Obtiene insights turísticos del índice UV
   */
  getUVInsights(): Observable<UVInsights> {
    return this.http.get<UVInsights>(`${this.baseUrl}/uv/insights`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo insights UV:', error);
          return of(this.getDefaultUVInsights());
        })
      );
  }

  // ============================================================
  // OVSICORI - VOLCÁN ARENAL
  // ============================================================

  /**
   * Obtiene estado actual del Volcán Arenal
   */
  getVolcanoStatus(): Observable<VolcanoStatus> {
    return this.http.get<VolcanoStatus>(`${this.baseUrl}/volcano/status`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo estado del volcán:', error);
          return of(this.getDefaultVolcanoStatus());
        })
      );
  }

  /**
   * Obtiene actividad sísmica reciente
   * @param limit Número de eventos (por defecto 10)
   */
  getVolcanoSeismic(limit: number = 10): Observable<VolcanoSeismic> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<VolcanoSeismic>(`${this.baseUrl}/volcano/seismic`, { params })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo actividad sísmica:', error);
          return of(this.getDefaultVolcanoSeismic());
        })
      );
  }

  /**
   * Obtiene insights turísticos del volcán
   */
  getVolcanoInsights(): Observable<VolcanoInsights> {
    return this.http.get<VolcanoInsights>(`${this.baseUrl}/volcano/insights`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo insights volcánicos:', error);
          return of(this.getDefaultVolcanoInsights());
        })
      );
  }

  // ============================================================
  // ICT - EVENTOS Y NOTICIAS
  // ============================================================

  /**
   * Obtiene noticias recientes del ICT
   * @param limit Número de noticias (por defecto 10)
   */
  getEventsRecent(limit: number = 10): Observable<EventsRecent> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<EventsRecent>(`${this.baseUrl}/events/recent`, { params })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo noticias recientes:', error);
          return of(this.getDefaultEventsRecent());
        })
      );
  }

  /**
   * Obtiene noticias de turismo de bienestar
   * @param limit Número de noticias (por defecto 20)
   */
  getEventsWellness(limit: number = 20): Observable<EventsWellness> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<EventsWellness>(`${this.baseUrl}/events/wellness`, { params })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo noticias wellness:', error);
          return of(this.getDefaultEventsWellness());
        })
      );
  }

  /**
   * Obtiene noticias relevantes para La Fortuna
   * @param limit Número de noticias (por defecto 20)
   */
  getEventsLaFortuna(limit: number = 20): Observable<EventsLaFortuna> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<EventsLaFortuna>(`${this.baseUrl}/events/la-fortuna`, { params })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo noticias La Fortuna:', error);
          return of(this.getDefaultEventsLaFortuna());
        })
      );
  }

  /**
   * Obtiene insights turísticos de eventos
   */
  getEventsInsights(): Observable<EventsInsights> {
    return this.http.get<EventsInsights>(`${this.baseUrl}/events/insights`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo insights de eventos:', error);
          return of(this.getDefaultEventsInsights());
        })
      );
  }

  // ============================================================
  // MÉTODOS AUXILIARES - DATOS POR DEFECTO
  // ============================================================

  private getDefaultWeatherCurrent(): ClimaCurrent {
    return {
      success: false,
      error: 'Servicio no disponible',
      data: {
        temperature: 0,
        feels_like: 0,
        humidity: 0,
        description: 'No disponible',
        wind_speed: 0
      }
    };
  }

  private getDefaultWeatherForecast(): ClimaForecast {
    return {
      success: false,
      error: 'Servicio no disponible',
      forecast: []
    };
  }

  private getDefaultTourismMetrics(): ClimaTourismMetrics {
    return {
      success: false,
      error: 'Servicio no disponible',
      metrics: {
        tourism_score: 0,
        recommendations: []
      }
    };
  }

  private getDefaultIMNCurrent(): IMNCurrent {
    return {
      success: false,
      error: 'Servicio IMN no disponible'
    };
  }

  private getDefaultIMNHourly(): IMNHourly {
    return {
      success: false,
      error: 'Servicio IMN no disponible',
      hourly_readings: []
    };
  }

  private getDefaultIMNDaily(): IMNDaily {
    return {
      success: false,
      error: 'Servicio IMN no disponible'
    };
  }

  private getDefaultIMNInsights(): IMNInsights {
    return {
      success: false,
      error: 'Servicio IMN no disponible',
      insights: {
        recommendations: [],
        alerts: []
      }
    };
  }

  private getDefaultUVCurrent(): UVCurrent {
    return {
      success: false,
      error: 'Servicio UV no disponible'
    };
  }

  private getDefaultUVForecast(): UVForecast {
    return {
      success: false,
      error: 'Servicio UV no disponible'
    };
  }

  private getDefaultUVInsights(): UVInsights {
    return {
      success: false,
      error: 'Servicio UV no disponible',
      insights: {
        recommendations: []
      }
    };
  }

  private getDefaultVolcanoStatus(): VolcanoStatus {
    return {
      success: false,
      error: 'Servicio OVSICORI no disponible'
    };
  }

  private getDefaultVolcanoSeismic(): VolcanoSeismic {
    return {
      success: false,
      error: 'Servicio OVSICORI no disponible',
      seismic_events: []
    };
  }

  private getDefaultVolcanoInsights(): VolcanoInsights {
    return {
      success: false,
      error: 'Servicio OVSICORI no disponible',
      insights: {
        tourism_impact: '',
        recommendations: [],
        safety_status: 'No disponible'
      }
    };
  }

  private getDefaultEventsRecent(): EventsRecent {
    return {
      success: false,
      error: 'Servicio ICT no disponible',
      news: []
    };
  }

  private getDefaultEventsWellness(): EventsWellness {
    return {
      success: false,
      error: 'Servicio ICT no disponible',
      wellness_news: []
    };
  }

  private getDefaultEventsLaFortuna(): EventsLaFortuna {
    return {
      success: false,
      error: 'Servicio ICT no disponible',
      la_fortuna_news: []
    };
  }

  private getDefaultEventsInsights(): EventsInsights {
    return {
      success: false,
      error: 'Servicio ICT no disponible',
      insights: {
        trending_topics: [],
        upcoming_events: []
      }
    };
  }
}
