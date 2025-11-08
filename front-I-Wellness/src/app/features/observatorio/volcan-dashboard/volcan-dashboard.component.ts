import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ObservatorioService } from '../../../shared/services/observatorio.service';
import { VolcanoStatus, VolcanoSeismic, VolcanoInsights } from '../../../shared/models/observatorio.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-volcan-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <button class="back-btn" routerLink="/observatorio">
          <span class="material-icons">arrow_back</span>
          Volver al Observatorio
        </button>
        <h1><span class="material-icons">landscape</span> Dashboard Volcán Arenal</h1>
        <button class="refresh-btn" (click)="refreshData()" [disabled]="loading">
          <span class="material-icons" [class.spinning]="loading">refresh</span>
        </button>
      </header>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando datos volcánicos...</p>
      </div>

      <div *ngIf="!loading" class="content">
        <!-- Estado del Volcán -->
        <section class="card status-card" *ngIf="status?.success && status.data">
          <h2>Estado Actual</h2>
          <div class="status-display" [style.border-color]="getStatusColor()">
            <div class="status-icon" [style.background-color]="getStatusColor()">
              <span class="material-icons">{{ status.data.tourism_safe ? 'check_circle' : 'warning' }}</span>
            </div>
            <div class="status-info">
              <h3>{{ status.data.status }}</h3>
              <p class="alert-level">Nivel de Alerta: <strong>{{ status.data.alert_level }}</strong></p>
              <p class="description">{{ status.data.activity_description }}</p>
            </div>
          </div>
          
          <div class="tourism-badge" [class.safe]="status.data.tourism_safe" [class.warning]="!status.data.tourism_safe">
            <span class="material-icons">{{ status.data.tourism_safe ? 'verified' : 'priority_high' }}</span>
            {{ status.data.tourism_safe ? 'Seguro para Turismo' : 'Precaución Recomendada' }}
          </div>

          <div class="restrictions" *ngIf="status.data.restrictions && status.data.restrictions.length > 0">
            <h4>Restricciones</h4>
            <ul>
              <li *ngFor="let restriction of status.data.restrictions">{{ restriction }}</li>
            </ul>
          </div>

          <div class="last-update">
            <span class="material-icons">update</span>
            Última actualización: {{ status.data.last_update }}
          </div>
        </section>

        <!-- Actividad Sísmica -->
        <section class="card seismic-card" *ngIf="seismic?.success && seismic.seismic_events">
          <h2>Actividad Sísmica Reciente</h2>
          
          <div class="seismic-summary" *ngIf="seismic.summary && seismic.summary.total_events > 0">
            <div class="summary-item">
              <span class="material-icons">analytics</span>
              <div>
                <strong>{{ seismic.summary.total_events }}</strong>
                <span>Eventos</span>
              </div>
            </div>
            <div class="summary-item">
              <span class="material-icons">trending_up</span>
              <div>
                <strong>{{ seismic.summary.max_magnitude }}</strong>
                <span>Magnitud Máx</span>
              </div>
            </div>
            <div class="summary-item">
              <span class="material-icons">show_chart</span>
              <div>
                <strong>{{ seismic.summary.avg_magnitude?.toFixed(2) || 'N/A' }}</strong>
                <span>Magnitud Prom</span>
              </div>
            </div>
          </div>

          <div class="no-seismic-data" *ngIf="!seismic.summary || !seismic.summary.total_events || seismic.summary.total_events === 0">
            <span class="material-icons">check_circle</span>
            <p>No se han registrado eventos sísmicos significativos en las últimas 24 horas.</p>
          </div>

          <div class="seismic-list">
            <div *ngFor="let event of seismic.seismic_events" class="seismic-event" [class.felt]="event.felt">
              <div class="event-header">
                <span class="event-magnitude">M {{ event.magnitude }}</span>
                <span class="event-date">{{ event.date }} {{ event.time }}</span>
              </div>
              <div class="event-details">
                <div class="detail"><span class="material-icons">terrain</span> Profundidad: {{ event.depth }} km</div>
                <div class="detail"><span class="material-icons">place</span> {{ event.location }}</div>
                <div class="detail" *ngIf="event.distance_from_arenal">
                  <span class="material-icons">straighten</span> 
                  {{ event.distance_from_arenal }} km del Arenal
                </div>
              </div>
              <div class="felt-badge" *ngIf="event.felt">
                <span class="material-icons">pan_tool</span>
                Sismo Percibido
              </div>
            </div>
          </div>
        </section>

        <!-- Insights Turísticos -->
        <section class="card insights-card" *ngIf="insights?.success && insights.insights">
          <h2>Información Turística</h2>
          
          <div class="tourism-impact">
            <h3><span class="material-icons">info</span> Impacto en Turismo</h3>
            <p>{{ insights.insights.tourism_impact }}</p>
          </div>

          <div class="safety-status">
            <h3><span class="material-icons">security</span> Estado de Seguridad</h3>
            <p>{{ insights.insights.safety_status }}</p>
          </div>

          <div class="recommendations-box">
            <h3><span class="material-icons">tips_and_updates</span> Recomendaciones</h3>
            <ul>
              <li *ngFor="let rec of insights.insights.recommendations">{{ rec }}</li>
            </ul>
          </div>

          <div class="guidelines" *ngIf="insights.insights.visitor_guidelines && insights.insights.visitor_guidelines.length > 0">
            <h3><span class="material-icons">rule</span> Guías para Visitantes</h3>
            <ul>
              <li *ngFor="let guide of insights.insights.visitor_guidelines">{{ guide }}</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
      padding: 2rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .dashboard-header h1 {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 0;
      color: #880e4f;
    }

    .back-btn, .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border: 2px solid #c2185b;
      border-radius: 8px;
      color: #c2185b;
      cursor: pointer;
      transition: all 0.3s;
    }

    .back-btn:hover, .refresh-btn:hover:not(:disabled) {
      background: #c2185b;
      color: white;
      transform: translateY(-2px);
    }

    .loading {
      text-align: center;
      padding: 4rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto;
      border: 4px solid rgba(194,24,91,0.2);
      border-top-color: #c2185b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .content {
      display: grid;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .card h2 {
      margin: 0 0 1.5rem 0;
      color: #880e4f;
    }

    .status-display {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      border: 3px solid;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .status-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .status-icon .material-icons {
      font-size: 40px;
      color: white;
    }

    .status-info h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }

    .alert-level {
      margin: 0 0 1rem 0;
      color: #666;
    }

    .description {
      margin: 0;
      line-height: 1.6;
    }

    .tourism-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 8px;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .tourism-badge.safe {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .tourism-badge.warning {
      background: #fff3e0;
      color: #f57c00;
    }

    .restrictions {
      padding: 1rem;
      background: #fff3e0;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .restrictions h4 {
      margin: 0 0 0.5rem 0;
      color: #f57c00;
    }

    .restrictions ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .last-update {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #666;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .seismic-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .no-seismic-data {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-radius: 12px;
      margin-bottom: 2rem;
      text-align: center;
      justify-content: center;
    }

    .no-seismic-data .material-icons {
      font-size: 48px;
      color: #4caf50;
    }

    .no-seismic-data p {
      margin: 0;
      font-size: 1rem;
      color: #2e7d32;
      font-weight: 500;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #f8bbd0 0%, #f48fb1 100%);
      color: white;
      border-radius: 12px;
    }

    .summary-item .material-icons {
      font-size: 32px;
    }

    .summary-item strong {
      display: block;
      font-size: 1.5rem;
    }

    .summary-item span {
      display: block;
      font-size: 0.85rem;
    }

    .seismic-list {
      display: grid;
      gap: 1rem;
    }

    .seismic-event {
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 12px;
      border-left: 4px solid #c2185b;
      transition: all 0.3s;
    }

    .seismic-event:hover {
      background: #fce4ec;
      transform: translateX(4px);
    }

    .seismic-event.felt {
      background: #fff3e0;
      border-left-color: #ff6f00;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .event-magnitude {
      font-size: 1.5rem;
      font-weight: 700;
      color: #c2185b;
    }

    .event-date {
      font-size: 0.9rem;
      color: #666;
    }

    .event-details {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .detail {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.9rem;
      color: #444;
    }

    .detail .material-icons {
      font-size: 18px;
      color: #c2185b;
    }

    .felt-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #ff6f00;
      color: white;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .tourism-impact, .safety-status {
      padding: 1rem;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .tourism-impact h3, .safety-status h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.75rem 0;
      color: #1976d2;
    }

    .tourism-impact p, .safety-status p {
      margin: 0;
      line-height: 1.6;
    }

    .recommendations-box, .guidelines {
      padding: 1rem;
      background: #e8f5e9;
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .recommendations-box h3, .guidelines h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      color: #2e7d32;
    }

    .recommendations-box ul, .guidelines ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .recommendations-box li, .guidelines li {
      margin: 0.5rem 0;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: stretch;
      }

      .status-display {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .seismic-summary {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VolcanDashboardComponent implements OnInit {
  loading = true;
  status: VolcanoStatus | null = null;
  seismic: VolcanoSeismic | null = null;
  insights: VolcanoInsights | null = null;
  Math = Math; // Para usar Math.abs en el template

  constructor(private observatorioService: ObservatorioService) {}

  ngOnInit(): void {
    this.loadVolcanoData();
    // Auto-refresh cada 15 minutos
    setInterval(() => this.loadVolcanoData(), 900000);
  }

  loadVolcanoData(): void {
    this.loading = true;
    forkJoin({
      status: this.observatorioService.getVolcanoStatus(),
      seismic: this.observatorioService.getVolcanoSeismic(15),
      insights: this.observatorioService.getVolcanoInsights()
    }).subscribe({
      next: (data) => {
        this.status = data.status;
        this.seismic = data.seismic;
        this.insights = data.insights;
        this.loading = false;
        console.log('Volcano Data loaded:', data);
      },
      error: (err) => {
        console.error('Error loading volcano data:', err);
        this.loading = false;
      }
    });
  }

  getVolcanoName(): string {
    return this.status?.extended_info?.volcano_name || 'Volcán Arenal';
  }

  getVolcanoLocation(): string {
    return this.status?.extended_info?.location || 'La Fortuna, San Carlos, Alajuela';
  }

  getAltitude(): string {
    const altitude = this.status?.extended_info?.altitude_m;
    return altitude ? `${altitude} m.s.n.m.` : '1670 m.s.n.m.';
  }

  getStatusGradient(): string {
    if (this.status?.data?.tourism_safe) {
      return 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)';
    }
    return 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)';
  }

  getVolcanoIcon(): string {
    return this.status?.data?.tourism_safe ? 'check_circle' : 'warning';
  }

  getAlertLevelBackground(): string {
    const alertLevel = this.status?.data?.alert_level?.toLowerCase() || '';
    if (alertLevel.includes('verde') || alertLevel.includes('normal')) {
      return 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)';
    }
    if (alertLevel.includes('amarillo')) {
      return 'linear-gradient(135deg, #FFEB3B 0%, #FFF176 100%)';
    }
    if (alertLevel.includes('naranja')) {
      return 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)';
    }
    if (alertLevel.includes('rojo')) {
      return 'linear-gradient(135deg, #F44336 0%, #E57373 100%)';
    }
    return 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)';
  }

  getAlertIcon(): string {
    const alertLevel = this.status?.data?.alert_level?.toLowerCase() || '';
    if (alertLevel.includes('normal')) return 'verified';
    if (alertLevel.includes('amarillo')) return 'warning';
    if (alertLevel.includes('naranja')) return 'error';
    if (alertLevel.includes('rojo')) return 'dangerous';
    return 'info';
  }

  getMagnitudeColor(magnitude: number): string {
    if (magnitude < 2) return '#4CAF50';
    if (magnitude < 3) return '#8BC34A';
    if (magnitude < 4) return '#FFEB3B';
    if (magnitude < 5) return '#FF9800';
    if (magnitude < 6) return '#F44336';
    return '#9C27B0';
  }

  formatEventDate(date: string, time: string): string {
    return `${date} ${time}`;
  }

  formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  }

  getStatusColor(): string {
    const status = this.status?.data?.alert_level?.toLowerCase();
    if (status?.includes('verde') || status?.includes('normal')) return '#4CAF50';
    if (status?.includes('amarillo')) return '#FFEB3B';
    if (status?.includes('naranja')) return '#FF9800';
    if (status?.includes('rojo')) return '#F44336';
    return '#2196F3';
  }

  refreshData(): void {
    this.loadVolcanoData();
  }
}
