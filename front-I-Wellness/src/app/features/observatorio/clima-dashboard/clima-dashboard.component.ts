import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ObservatorioService } from '../../../shared/services/observatorio.service';
import { ClimaCurrent, ClimaForecast, ClimaTourismMetrics, IMNInsights } from '../../../shared/models/observatorio.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-clima-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './clima-dashboard.component.html',
  styleUrls: ['./clima-dashboard.component.css']
})
export class ClimaDashboardComponent implements OnInit {
  loading = true;
  currentWeather: ClimaCurrent | null = null;
  forecast: ClimaForecast | null = null;
  metrics: ClimaTourismMetrics | null = null;
  imnInsights: IMNInsights | null = null;
  lastUpdate: Date = new Date();

  constructor(private observatorioService: ObservatorioService) {}

  ngOnInit(): void {
    this.loadClimaData();
    
    // Auto-refresh cada 15 minutos
    setInterval(() => this.loadClimaData(), 900000);
  }

  loadClimaData(): void {
    this.loading = true;

    forkJoin({
      current: this.observatorioService.getCurrentWeather(10.4675, -84.6436),
      forecast: this.observatorioService.getWeatherForecast(10.4675, -84.6436, 7),
      metrics: this.observatorioService.getWeatherTourismMetrics(10.4675, -84.6436),
      imnInsights: this.observatorioService.getIMNInsights()
    }).subscribe({
      next: (data) => {
        this.currentWeather = data.current;
        this.forecast = data.forecast;
        this.metrics = data.metrics;
        this.imnInsights = data.imnInsights;
        this.lastUpdate = new Date();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando datos del clima:', err);
        this.loading = false;
      }
    });
  }

  getTourismScoreClass(): string {
    const score = this.metrics?.metrics?.tourism_score || 0;
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-moderate';
    return 'score-poor';
  }

  getTourismScoreLabel(): string {
    const score = this.metrics?.metrics?.tourism_score || 0;
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Moderado';
    return 'Regular';
  }

  getTemperatureIcon(): string {
    const temp = this.currentWeather?.data?.temperature || 0;
    if (temp >= 30) return 'wb_sunny';
    if (temp >= 25) return 'wb_cloudy';
    if (temp >= 20) return 'cloud';
    return 'ac_unit';
  }

  getActivityScore(activity?: string): number {
    if (!this.metrics?.metrics?.activities_suitability || !activity) return 0;
    return this.metrics.metrics.activities_suitability[activity as keyof typeof this.metrics.metrics.activities_suitability] || 0;
  }

  getActivityClass(score: number): string {
    if (score >= 80) return 'activity-excellent';
    if (score >= 60) return 'activity-good';
    if (score >= 40) return 'activity-moderate';
    return 'activity-poor';
  }

  refreshData(): void {
    this.loadClimaData();
  }
}
