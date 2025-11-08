import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ObservatorioService } from '../../../shared/services/observatorio.service';
import type { UVCurrent, UVForecast, UVInsights } from '../../../shared/models/observatorio.models.js';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-uv-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <button class="back-btn" routerLink="/observatorio">
          <span class="material-icons">arrow_back</span>
          Volver al Observatorio
        </button>
        <h1>
          <span class="material-icons sun-icon">wb_sunny</span> 
          Dashboard de Índice UV - La Fortuna
        </h1>
        <button class="refresh-btn" (click)="refreshData()" [disabled]="loading">
          <span class="material-icons" [class.spinning]="loading">refresh</span>
          Actualizar
        </button>
      </header>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando datos UV en tiempo real...</p>
      </div>

      <div *ngIf="!loading" class="content">
        
        <!-- UV Actual - Card Principal -->
        <section class="card uv-main-card" *ngIf="currentUV?.success && currentUV.data">
          <div class="card-header">
            <h2><span class="material-icons">wb_sunny</span> Índice UV Actual</h2>
            <span class="data-source" *ngIf="currentUV.data_source">
              📡 {{ currentUV.data_source }}
            </span>
          </div>
          
          <div class="uv-hero">
            <div class="uv-display" [style.background]="getUVGradient(currentUV.data.uv_index)">
              <div class="uv-content">
                <div class="uv-value">{{ currentUV.data.uv_index }}</div>
                <div class="uv-level">{{ currentUV.data.level?.toUpperCase() }}</div>
                <div class="uv-category">{{ currentUV.data.risk_category }}</div>
              </div>
              <div class="uv-icon">
                <span class="material-icons">{{ getUVIcon(currentUV.data.uv_index) }}</span>
              </div>
            </div>
            
            <div class="uv-scale">
              <div class="scale-label">Escala UV</div>
              <div class="scale-bar">
                <div class="scale-segment" style="background: #4CAF50;">
                  <span>0-2</span>
                  <small>Bajo</small>
                </div>
                <div class="scale-segment" style="background: #FFEB3B; color: #333;">
                  <span>3-5</span>
                  <small>Moderado</small>
                </div>
                <div class="scale-segment" style="background: #FF9800;">
                  <span>6-7</span>
                  <small>Alto</small>
                </div>
                <div class="scale-segment" style="background: #F44336;">
                  <span>8-10</span>
                  <small>Muy Alto</small>
                </div>
                <div class="scale-segment" style="background: #9C27B0;">
                  <span>11+</span>
                  <small>Extremo</small>
                </div>
              </div>
              <div class="scale-indicator" [style.left.%]="getUVPercentage(currentUV.data.uv_index)">
                <div class="indicator-arrow"></div>
                <div class="indicator-label">Actual</div>
              </div>
            </div>
          </div>

          <div class="protection-alert" *ngIf="currentUV.data.protection_needed">
            <span class="material-icons alert-icon">shield</span>
            <div>
              <strong>¡Protección solar necesaria!</strong>
              <p>El nivel UV actual requiere medidas de protección</p>
            </div>
          </div>

          <div class="safe-exposure" *ngIf="currentUV.data.safe_exposure_time">
            <span class="material-icons">timer</span>
            <div>
              <strong>Tiempo de exposición segura:</strong>
              {{ currentUV.data.safe_exposure_time }} minutos
              <small>(piel tipo medio)</small>
            </div>
          </div>

          <div class="recommendations-grid">
            <h3><span class="material-icons">health_and_safety</span> Recomendaciones</h3>
            <div class="rec-items">
              <div class="rec-item" *ngFor="let rec of currentUV.data.recommendations">
                <span class="material-icons">check_circle</span>
                <span>{{ rec }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Pronóstico UV Horario -->
        <section class="card forecast-card" *ngIf="forecastUV?.success && forecastUV.forecast && forecastUV.forecast.length > 0">
          <h2><span class="material-icons">schedule</span> Pronóstico UV Horario</h2>
          <p class="card-subtitle">Planifique sus actividades según los niveles UV</p>
          
          <div class="forecast-chart">
            <div class="chart-container">
              <div *ngFor="let hour of forecastUV.forecast; let i = index" 
                   class="forecast-bar"
                   [style.height.%]="getBarHeight(hour.uv_index)"
                   [style.background]="getHourUVColor(hour.uv_index)"
                   [title]="'UV: ' + hour.uv_index + ' - ' + hour.level">
                <div class="bar-value">{{ hour.uv_index }}</div>
                <div class="bar-time">{{ hour.time }}</div>
              </div>
            </div>
            <div class="chart-legend">
              <div class="legend-item" *ngFor="let level of uvLevels" [style.color]="level.color">
                <div class="legend-dot" [style.background]="level.color"></div>
                <span>{{ level.name }}</span>
              </div>
            </div>
          </div>

          <div class="peak-info" *ngIf="forecastUV.daily_peak">
            <span class="material-icons">warning_amber</span>
            <div>
              <strong>Pico UV del día:</strong>
              {{ forecastUV.daily_peak.time }} - 
              Índice {{ forecastUV.daily_peak.uv_index }}
            </div>
          </div>
        </section>

        <!-- Insights y Consejos -->
        <section class="card insights-card" *ngIf="insights?.success && insights.insights">
          <h2><span class="material-icons">lightbulb</span> Insights y Recomendaciones Turísticas</h2>
          
          <div class="insights-grid">
            <!-- Mejores Horarios -->
            <div class="insight-box" *ngIf="insights.insights.best_outdoor_hours && insights.insights.best_outdoor_hours.length > 0">
              <div class="insight-icon">
                <span class="material-icons">schedule</span>
              </div>
              <h3>Mejores Horarios para Actividades</h3>
              <p class="insight-value">{{ insights.insights.best_outdoor_hours.join(', ') }}</p>
              <p class="insight-desc">Períodos con menor radiación UV</p>
            </div>

            <!-- Horarios Pico -->
            <div class="insight-box warning-box" *ngIf="insights.insights.peak_uv_times && insights.insights.peak_uv_times.length > 0">
              <div class="insight-icon warning">
                <span class="material-icons">wb_sunny</span>
              </div>
              <h3>Horarios de Mayor Radiación</h3>
              <p class="insight-value">{{ insights.insights.peak_uv_times.join(', ') }}</p>
              <p class="insight-desc">Evite exposición prolongada</p>
            </div>

            <!-- Consejos por Horario -->
            <div class="advice-timeline" *ngIf="insights.insights.activities_advice">
              <h3><span class="material-icons">hiking</span> Guía de Actividades por Horario</h3>
              
              <div class="timeline-item morning" *ngIf="insights.insights.activities_advice.morning">
                <div class="timeline-icon">
                  <span class="material-icons">wb_twilight</span>
                </div>
                <div class="timeline-content">
                  <h4>🌅 Mañana</h4>
                  <p>{{ insights.insights.activities_advice.morning }}</p>
                </div>
              </div>

              <div class="timeline-item midday" *ngIf="insights.insights.activities_advice.midday">
                <div class="timeline-icon">
                  <span class="material-icons">light_mode</span>
                </div>
                <div class="timeline-content">
                  <h4>☀️ Mediodía</h4>
                  <p>{{ insights.insights.activities_advice.midday }}</p>
                </div>
              </div>

              <div class="timeline-item afternoon" *ngIf="insights.insights.activities_advice.afternoon">
                <div class="timeline-icon">
                  <span class="material-icons">wb_twilight</span>
                </div>
                <div class="timeline-content">
                  <h4>🌇 Tarde</h4>
                  <p>{{ insights.insights.activities_advice.afternoon }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Información Adicional -->
        <section class="card info-card">
          <h2><span class="material-icons">info</span> Información sobre el Índice UV</h2>
          <div class="info-grid">
            <div class="info-item">
              <h4>¿Qué es el Índice UV?</h4>
              <p>Es una medida de la intensidad de la radiación ultravioleta del sol en la superficie terrestre. 
                 Valores más altos indican mayor riesgo de daño en la piel y los ojos.</p>
            </div>
            <div class="info-item">
              <h4>Importancia en Turismo de Bienestar</h4>
              <p>Conocer el índice UV ayuda a planificar actividades al aire libre de forma segura, 
                 protegiendo la salud de visitantes mientras disfrutan de La Fortuna.</p>
            </div>
            <div class="info-item">
              <h4>Datos en Tiempo Real</h4>
              <p>Esta información proviene del Instituto Meteorológico Nacional (IMN) de Costa Rica, 
                 estación ADIFORT en La Fortuna, actualizada continuamente.</p>
            </div>
          </div>
        </section>

      </div>

      <!-- Timestamp -->
      <div class="update-time" *ngIf="!loading && currentUV?.timestamp">
        <span class="material-icons">schedule</span>
        Última actualización: {{ formatTimestamp(currentUV.timestamp) }}
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #fff3e0 0%, #ffecb3 50%, #ffe082 100%);
      padding: 2rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      background: white;
      padding: 1.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .dashboard-header h1 {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 0;
      color: #e65100;
      font-size: 1.75rem;
    }

    .sun-icon {
      animation: rotate 20s linear infinite;
      font-size: 2.5rem !important;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .back-btn, .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border: 2px solid #ff9800;
      border-radius: 8px;
      color: #ff9800;
      cursor: pointer;
      transition: all 0.3s;
      font-weight: 600;
    }

    .back-btn:hover, .refresh-btn:hover:not(:disabled) {
      background: #ff9800;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading {
      text-align: center;
      padding: 4rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .spinner {
      width: 60px;
      height: 60px;
      margin: 0 auto;
      border: 5px solid rgba(255,152,0,0.2);
      border-top-color: #ff9800;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    .content {
      display: grid;
      gap: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .card h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 0 1.5rem 0;
      color: #e65100;
      font-size: 1.5rem;
    }

    .card-subtitle {
      color: #666;
      margin: -1rem 0 1.5rem 0;
      font-size: 0.95rem;
    }

    .data-source {
      background: #e3f2fd;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #1976d2;
    }

    .uv-main-card {
      background: linear-gradient(135deg, #fff 0%, #fff8e1 100%);
    }

    .uv-hero {
      margin-bottom: 2rem;
    }

    .uv-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3rem;
      border-radius: 20px;
      color: white;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }

    .uv-display::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
      animation: pulse 4s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .uv-content, .uv-icon {
      position: relative;
      z-index: 1;
    }

    .uv-value {
      font-size: 5rem;
      font-weight: 800;
      line-height: 1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .uv-level {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0.5rem 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .uv-category {
      font-size: 1.1rem;
      opacity: 0.95;
    }

    .uv-icon .material-icons {
      font-size: 8rem;
      opacity: 0.3;
    }

    .uv-scale {
      position: relative;
      padding: 1.5rem 0;
    }

    .scale-label {
      font-weight: 600;
      color: #666;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }

    .scale-bar {
      display: flex;
      height: 60px;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .scale-segment {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      position: relative;
    }

    .scale-segment span {
      font-size: 1.1rem;
    }

    .scale-segment small {
      font-size: 0.75rem;
      opacity: 0.9;
      margin-top: 0.25rem;
    }

    .scale-indicator {
      position: absolute;
      bottom: -30px;
      transform: translateX(-50%);
      transition: left 0.5s ease-out;
    }

    .indicator-arrow {
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 12px solid #333;
      margin: 0 auto;
    }

    .indicator-label {
      background: #333;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-top: 0.25rem;
      white-space: nowrap;
    }

    .protection-alert {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      color: #c62828;
      border-radius: 12px;
      font-weight: 500;
      margin-bottom: 1.5rem;
      border-left: 4px solid #c62828;
    }

    .alert-icon {
      font-size: 2rem !important;
    }

    .protection-alert strong {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 1.1rem;
    }

    .protection-alert p {
      margin: 0;
      opacity: 0.9;
    }

    .safe-exposure {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #e8f5e9;
      border-radius: 12px;
      color: #2e7d32;
      margin-bottom: 1.5rem;
    }

    .safe-exposure strong {
      display: block;
    }

    .safe-exposure small {
      color: #666;
      font-size: 0.85rem;
    }

    .recommendations-grid h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #ff9800;
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .rec-items {
      display: grid;
      gap: 0.75rem;
    }

    .rec-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
      border-radius: 12px;
      border-left: 4px solid #ff9800;
      transition: all 0.3s;
    }

    .rec-item:hover {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      transform: translateX(4px);
    }

    .rec-item .material-icons {
      color: #4caf50;
      font-size: 1.5rem;
    }

    .forecast-card {
      background: linear-gradient(135deg, #fff 0%, #e3f2fd 100%);
    }

    .forecast-chart {
      margin: 1.5rem 0;
    }

    .chart-container {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 300px;
      padding: 1rem;
      background: rgba(255,255,255,0.7);
      border-radius: 12px;
      overflow-x: auto;
    }

    .forecast-bar {
      flex: 1;
      min-width: 60px;
      border-radius: 8px 8px 0 0;
      position: relative;
      transition: all 0.3s;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      padding-top: 0.5rem;
    }

    .forecast-bar:hover {
      opacity: 0.8;
      transform: scale(1.05);
    }

    .bar-value {
      color: white;
      font-weight: 700;
      font-size: 1.2rem;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    .bar-time {
      position: absolute;
      bottom: -30px;
      font-size: 0.85rem;
      color: #666;
      font-weight: 600;
    }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 3rem;
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .peak-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #fff3e0;
      border-radius: 12px;
      color: #e65100;
      margin-top: 1.5rem;
      border-left: 4px solid #ff9800;
    }

    .insights-card {
      background: linear-gradient(135deg, #fff 0%, #f3e5f5 100%);
    }

    .insights-grid {
      display: grid;
      gap: 2rem;
    }

    .insight-box {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-left: 4px solid #4caf50;
    }

    .warning-box {
      border-left-color: #ff9800;
      background: linear-gradient(135deg, #fff 0%, #fff3e0 100%);
    }

    .insight-icon {
      width: 60px;
      height: 60px;
      background: #e8f5e9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .insight-icon.warning {
      background: #fff3e0;
    }

    .insight-icon .material-icons {
      font-size: 2rem;
      color: #4caf50;
    }

    .insight-icon.warning .material-icons {
      color: #ff9800;
    }

    .insight-box h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
    }

    .insight-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1976d2;
      margin: 0.5rem 0;
    }

    .insight-desc {
      color: #666;
      margin: 0.5rem 0 0 0;
      font-size: 0.95rem;
    }

    .advice-timeline {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .advice-timeline h3 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 0 2rem 0;
      color: #e65100;
    }

    .timeline-item {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #f5f5f5;
    }

    .timeline-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .timeline-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .morning .timeline-icon {
      background: linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%);
    }

    .midday .timeline-icon {
      background: linear-gradient(135deg, #ffecb3 0%, #ffe082 100%);
    }

    .afternoon .timeline-icon {
      background: linear-gradient(135deg, #ffe082 0%, #ffd54f 100%);
    }

    .timeline-icon .material-icons {
      color: #e65100;
      font-size: 1.75rem;
    }

    .timeline-content h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.1rem;
    }

    .timeline-content p {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }

    .info-card {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .info-item {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .info-item h4 {
      color: #1976d2;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .info-item p {
      color: #666;
      line-height: 1.7;
      margin: 0;
      font-size: 0.95rem;
    }

    .update-time {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      background: rgba(255,255,255,0.9);
      border-radius: 12px;
      margin-top: 2rem;
      color: #666;
      font-size: 0.9rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: stretch;
      }

      .dashboard-header h1 {
        font-size: 1.25rem;
      }

      .uv-display {
        flex-direction: column;
        text-align: center;
      }

      .uv-value {
        font-size: 4rem;
      }

      .chart-container {
        height: 200px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .scale-bar {
        height: 50px;
      }

      .scale-segment span {
        font-size: 0.9rem;
      }

      .scale-segment small {
        font-size: 0.65rem;
      }
    }
  `]
})
export class UvDashboardComponent implements OnInit {
  loading = true;
  currentUV: UVCurrent | null = null;
  forecastUV: UVForecast | null = null;
  insights: UVInsights | null = null;

  uvLevels = [
    { name: 'Bajo (0-2)', color: '#4CAF50' },
    { name: 'Moderado (3-5)', color: '#FFEB3B' },
    { name: 'Alto (6-7)', color: '#FF9800' },
    { name: 'Muy Alto (8-10)', color: '#F44336' },
    { name: 'Extremo (11+)', color: '#9C27B0' }
  ];

  constructor(private observatorioService: ObservatorioService) {}

  ngOnInit(): void {
    this.loadUVData();
    // Auto-refresh cada 15 minutos
    setInterval(() => this.loadUVData(), 900000);
  }

  loadUVData(): void {
    this.loading = true;
    forkJoin({
      current: this.observatorioService.getUVCurrent(),
      forecast: this.observatorioService.getUVForecast(),
      insights: this.observatorioService.getUVInsights()
    }).subscribe({
      next: (data) => {
        this.currentUV = data.current;
        this.forecastUV = data.forecast;
        this.insights = data.insights;
        this.loading = false;
        console.log('UV Data loaded:', data);
      },
      error: (err) => {
        console.error('Error loading UV data:', err);
        this.loading = false;
      }
    });
  }

  getUVGradient(uv: number): string {
    if (uv <= 2) return 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)';
    if (uv <= 5) return 'linear-gradient(135deg, #FFEB3B 0%, #FFF176 100%)';
    if (uv <= 7) return 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)';
    if (uv <= 10) return 'linear-gradient(135deg, #F44336 0%, #E57373 100%)';
    return 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)';
  }

  getUVIcon(uv: number): string {
    if (uv <= 2) return 'wb_cloudy';
    if (uv <= 5) return 'wb_sunny';
    if (uv <= 7) return 'light_mode';
    if (uv <= 10) return 'warning';
    return 'report_problem';
  }

  getUVPercentage(uv: number): number {
    // Mapea el índice UV (0-15+) a porcentaje (0-100%)
    const maxUV = 15;
    return Math.min((uv / maxUV) * 100, 100);
  }

  getHourUVColor(uv: number): string {
    if (uv <= 2) return '#4CAF50';
    if (uv <= 5) return '#FFEB3B';
    if (uv <= 7) return '#FF9800';
    if (uv <= 10) return '#F44336';
    return '#9C27B0';
  }

  getBarHeight(uv: number): number {
    // Altura de la barra en base al valor UV (0-15 → 0-100%)
    const maxUV = 15;
    return Math.min((uv / maxUV) * 100, 100);
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

  refreshData(): void {
    this.loadUVData();
  }
}
