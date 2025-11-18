import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ObservatorioService } from '../../../shared/services/observatorio.service';
import { EventsRecent, EventsWellness, EventsLaFortuna, EventsInsights } from '../../../shared/models/observatorio.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-eventos-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <button class="back-btn" routerLink="/observatorio">
          <span class="material-icons">arrow_back</span>
          Volver al Observatorio
        </button>
        <div class="header-title">
          <h1><span class="material-icons">event</span> Eventos y Noticias Turísticas</h1>
          <p class="subtitle">Instituto Costarricense de Turismo - ICT</p>
        </div>
        <button class="refresh-btn" (click)="refreshData()" [disabled]="loading">
          <span class="material-icons" [class.spinning]="loading">refresh</span>
        </button>
      </header>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando noticias y eventos turísticos...</p>
      </div>

      <div *ngIf="!loading" class="content">
        <!-- Hero Card con Insights -->
        <section class="hero-card" *ngIf="insights?.success && insights.insights">
          <div class="hero-content">
            <div class="hero-icon">
              <span class="material-icons">insights</span>
            </div>
            <div class="hero-info">
              <h2>Tendencias del Turismo Costarricense</h2>
              <p>Descubre las últimas noticias, eventos y tendencias del sector turístico nacional</p>
            </div>
          </div>
          
          <div class="trends-section" *ngIf="insights.insights!.trending_topics && insights.insights!.trending_topics.length > 0">
            <h3><span class="material-icons">trending_up</span> Temas en Tendencia</h3>
            <div class="tags-container">
              <span *ngFor="let topic of insights.insights!.trending_topics" class="trend-tag">
                <span class="material-icons">tag</span>
                {{ topic }}
              </span>
            </div>
          </div>

          <div class="upcoming-section" *ngIf="insights.insights!.upcoming_events && insights.insights!.upcoming_events.length > 0">
            <h3><span class="material-icons">event_available</span> Próximos Eventos</h3>
            <div class="events-grid">
              <div *ngFor="let event of insights.insights!.upcoming_events" class="event-card">
                <span class="event-badge">{{ event.category }}</span>
                <h4>{{ event.name }}</h4>
                <div class="event-info">
                  <div class="info-item">
                    <span class="material-icons">calendar_today</span>
                    <span>{{ formatEventDate(event.date) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="material-icons">place</span>
                    <span>{{ event.location }}</span>
                  </div>
                </div>
                <p class="event-description">{{ event.description }}</p>
                <a *ngIf="event.url" [href]="event.url" target="_blank" class="event-link">
                  <span>Más información</span>
                  <span class="material-icons">open_in_new</span>
                </a>
              </div>
            </div>
          </div>

          <div class="wellness-highlights" *ngIf="insights.insights!.wellness_trends && insights.insights!.wellness_trends.length > 0">
            <h3><span class="material-icons">spa</span> Tendencias en Turismo de Bienestar</h3>
            <div class="highlights-list">
              <div *ngFor="let trend of insights.insights!.wellness_trends" class="highlight-item">
                <span class="material-icons">check_circle</span>
                <span>{{ trend }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Noticias de Bienestar -->
        <section class="news-section wellness-section" *ngIf="wellness?.success && wellness.wellness_news && wellness.wellness_news.length > 0">
          <div class="section-header">
            <div class="header-icon wellness">
              <span class="material-icons">spa</span>
            </div>
            <div>
              <h2>Turismo de Bienestar</h2>
              <p class="section-subtitle">Últimas noticias sobre wellness, spa y experiencias de bienestar</p>
              <span class="article-count">{{ wellness.total || wellness.wellness_news!.length }} artículos disponibles</span>
            </div>
          </div>
          
          <div class="news-grid">
            <article *ngFor="let news of wellness.wellness_news!" class="news-card wellness">
              <div class="card-header">
                <span class="category-badge wellness">
                  <span class="material-icons">spa</span>
                  {{ news.category || 'Bienestar' }}
                </span>
                <span class="news-date">
                  <span class="material-icons">schedule</span>
                  {{ formatNewsDate(news.date) }}
                </span>
              </div>
              <h3 class="news-title">{{ news.title }}</h3>
              <p class="news-summary">{{ news.summary }}</p>
              <div class="card-footer">
                <div class="news-tags" *ngIf="news.tags && news.tags.length > 0">
                  <span *ngFor="let tag of news.tags.slice(0, 3)" class="mini-tag">{{ tag }}</span>
                </div>
                <a [href]="news.url" target="_blank" class="read-more wellness">
                  <span>Leer artículo</span>
                  <span class="material-icons">arrow_forward</span>
                </a>
              </div>
            </article>
          </div>
        </section>

        <!-- Noticias de La Fortuna -->
        <section class="news-section lafortuna-section" *ngIf="laFortuna?.success && laFortuna.la_fortuna_news && laFortuna.la_fortuna_news.length > 0">
          <div class="section-header">
            <div class="header-icon lafortuna">
              <span class="material-icons">location_city</span>
            </div>
            <div>
              <h2>Noticias de La Fortuna</h2>
              <p class="section-subtitle">Información relevante sobre La Fortuna, San Carlos y zona norte</p>
              <span class="article-count">{{ laFortuna.total || laFortuna.la_fortuna_news!.length }} artículos · Relevancia: {{ (laFortuna.relevance_score || 0).toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="news-grid">
            <article *ngFor="let news of laFortuna.la_fortuna_news!" class="news-card lafortuna">
              <div class="card-header">
                <span class="category-badge lafortuna">
                  <span class="material-icons">location_city</span>
                  {{ news.category || 'La Fortuna' }}
                </span>
                <span class="news-date">
                  <span class="material-icons">schedule</span>
                  {{ formatNewsDate(news.date) }}
                </span>
              </div>
              <h3 class="news-title">{{ news.title }}</h3>
              <p class="news-summary">{{ news.summary }}</p>
              <div class="card-footer">
                <div class="news-tags" *ngIf="news.tags && news.tags.length > 0">
                  <span *ngFor="let tag of news.tags.slice(0, 3)" class="mini-tag">{{ tag }}</span>
                </div>
                <a [href]="news.url" target="_blank" class="read-more lafortuna">
                  <span>Leer artículo</span>
                  <span class="material-icons">arrow_forward</span>
                </a>
              </div>
            </article>
          </div>
        </section>

        <!-- Noticias Recientes ICT -->
        <section class="news-section recent-section" *ngIf="recent?.success && recent.news && recent.news.length > 0">
          <div class="section-header">
            <div class="header-icon recent">
              <span class="material-icons">newspaper</span>
            </div>
            <div>
              <h2>Últimas Noticias ICT</h2>
              <p class="section-subtitle">Lo más reciente del Instituto Costarricense de Turismo</p>
              <span class="article-count">{{ recent.total || recent.news!.length }} noticias · Actualizado: {{ formatTimestamp(recent.last_updated) }}</span>
            </div>
          </div>
          
          <div class="news-grid">
            <article *ngFor="let news of recent.news!" class="news-card recent">
              <div class="card-header">
                <span class="category-badge recent">
                  <span class="material-icons">newspaper</span>
                  {{ news.category || 'General' }}
                </span>
                <span class="news-date">
                  <span class="material-icons">schedule</span>
                  {{ formatNewsDate(news.date) }}
                </span>
              </div>
              <h3 class="news-title">{{ news.title }}</h3>
              <p class="news-summary">{{ news.summary }}</p>
              <div class="card-footer">
                <span class="news-source">
                  <span class="material-icons">source</span>
                  {{ news.source }}
                </span>
                <a [href]="news.url" target="_blank" class="read-more recent">
                  <span>Leer artículo</span>
                  <span class="material-icons">arrow_forward</span>
                </a>
              </div>
            </article>
          </div>
        </section>

        <!-- Mensaje si no hay datos -->
        <div *ngIf="!loading && !hasAnyData()" class="no-data">
          <span class="material-icons">info</span>
          <h3>No hay noticias disponibles</h3>
          <p>No se pudieron cargar las noticias en este momento. Por favor, intenta de nuevo más tarde.</p>
          <button class="refresh-btn" (click)="refreshData()">
            <span class="material-icons">refresh</span>
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #e8eaf6 0%, #c5cae9 50%, #9fa8da 100%);
      padding: 2rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .header-title {
      flex: 1;
    }

    .dashboard-header h1 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 0 0.25rem 0;
      color: #311b92;
      font-size: 2rem;
    }

    .dashboard-header h1 .material-icons {
      font-size: 2.5rem;
      background: linear-gradient(135deg, #7e57c2 0%, #5e35b1 100%);
      color: white;
      border-radius: 12px;
      padding: 0.5rem;
    }

    .subtitle {
      margin: 0;
      color: #5e35b1;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .back-btn, .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: white;
      border: 2px solid #5e35b1;
      border-radius: 12px;
      color: #5e35b1;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
    }

    .back-btn:hover, .refresh-btn:hover:not(:disabled) {
      background: #5e35b1;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(94,53,177,0.3);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading {
      text-align: center;
      padding: 4rem;
      color: #5e35b1;
    }

    .spinner {
      width: 60px;
      height: 60px;
      margin: 0 auto 1rem;
      border: 5px solid rgba(94,53,177,0.2);
      border-top-color: #5e35b1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .content {
      display: grid;
      gap: 2.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Hero Card */
    .hero-card {
      background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .hero-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .hero-icon {
      background: linear-gradient(135deg, #7e57c2 0%, #5e35b1 100%);
      color: white;
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(94,53,177,0.3);
    }

    .hero-icon .material-icons {
      font-size: 3.5rem;
    }

    .hero-info h2 {
      margin: 0 0 0.5rem 0;
      color: #311b92;
      font-size: 1.8rem;
    }

    .hero-info p {
      margin: 0;
      color: #666;
      font-size: 1.05rem;
    }

    .trends-section, .upcoming-section, .wellness-highlights {
      margin-bottom: 2rem;
    }

    .trends-section h3, .upcoming-section h3, .wellness-highlights h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1.25rem 0;
      color: #5e35b1;
      font-size: 1.3rem;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .trend-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #7e57c2 0%, #5e35b1 100%);
      color: white;
      border-radius: 25px;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.3s;
      cursor: default;
    }

    .trend-tag:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(94,53,177,0.3);
    }

    .trend-tag .material-icons {
      font-size: 18px;
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .event-card {
      padding: 1.75rem;
      background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
      border-radius: 16px;
      border-left: 5px solid #7e57c2;
      transition: all 0.3s;
    }

    .event-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(126,87,194,0.25);
    }

    .event-badge {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: #7e57c2;
      color: white;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1rem;
    }

    .event-card h4 {
      margin: 0 0 1rem 0;
      color: #311b92;
      font-size: 1.2rem;
      line-height: 1.4;
    }

    .event-info {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin-bottom: 1rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #555;
      font-size: 0.9rem;
    }

    .info-item .material-icons {
      font-size: 18px;
      color: #7e57c2;
    }

    .event-description {
      margin: 0 0 1.25rem 0;
      line-height: 1.6;
      color: #444;
    }

    .event-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #7e57c2;
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.3s;
    }

    .event-link:hover {
      background: #5e35b1;
      gap: 0.75rem;
      box-shadow: 0 4px 12px rgba(94,53,177,0.4);
    }

    .highlights-list {
      display: grid;
      gap: 0.75rem;
    }

    .highlight-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(126,87,194,0.1);
      border-radius: 10px;
      color: #444;
      font-size: 0.95rem;
    }

    .highlight-item .material-icons {
      color: #7e57c2;
      font-size: 22px;
    }

    /* News Sections */
    .news-section {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 3px solid #f0f0f0;
    }

    .header-icon {
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .header-icon.wellness {
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
    }

    .header-icon.lafortuna {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    }

    .header-icon.recent {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    }

    .header-icon .material-icons {
      color: white;
      font-size: 2.5rem;
    }

    .section-header h2 {
      margin: 0 0 0.5rem 0;
      color: #212121;
      font-size: 1.8rem;
    }

    .section-subtitle {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 1rem;
    }

    .article-count {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: #f5f5f5;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #555;
      font-weight: 600;
    }

    .news-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .news-card {
      padding: 1.75rem;
      border-radius: 16px;
      transition: all 0.3s;
      border-left: 5px solid;
    }

    .news-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }

    .news-card.wellness {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-left-color: #4caf50;
    }

    .news-card.lafortuna {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border-left-color: #ff9800;
    }

    .news-card.recent {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-left-color: #2196f3;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .category-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: white;
    }

    .category-badge.wellness {
      background: #4caf50;
    }

    .category-badge.lafortuna {
      background: #ff9800;
    }

    .category-badge.recent {
      background: #2196f3;
    }

    .category-badge .material-icons {
      font-size: 16px;
    }

    .news-date {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
      color: #666;
    }

    .news-date .material-icons {
      font-size: 16px;
    }

    .news-title {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      color: #212121;
      line-height: 1.4;
      font-weight: 600;
    }

    .news-summary {
      margin: 0 0 1.25rem 0;
      line-height: 1.7;
      color: #444;
      font-size: 0.95rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .news-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      flex: 1;
    }

    .mini-tag {
      padding: 0.35rem 0.85rem;
      background: rgba(0,0,0,0.12);
      border-radius: 15px;
      font-size: 0.75rem;
      color: #555;
      font-weight: 600;
    }

    .news-source {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #666;
      font-weight: 500;
    }

    .news-source .material-icons {
      font-size: 16px;
    }

    .read-more {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s;
      color: white;
    }

    .read-more.wellness {
      background: #4caf50;
    }

    .read-more.lafortuna {
      background: #ff9800;
    }

    .read-more.recent {
      background: #2196f3;
    }

    .read-more:hover {
      gap: 0.75rem;
      transform: translateX(2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .read-more .material-icons {
      font-size: 18px;
    }

    .no-data {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .no-data .material-icons {
      font-size: 5rem;
      color: #9e9e9e;
      margin-bottom: 1rem;
    }

    .no-data h3 {
      margin: 0 0 0.5rem 0;
      color: #555;
    }

    .no-data p {
      margin: 0 0 1.5rem 0;
      color: #777;
    }

    @media (max-width: 1024px) {
      .news-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      }

      .events-grid {
        grid-template-columns: 1fr;
      }
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
        font-size: 1.5rem;
      }

      .hero-content {
        flex-direction: column;
        text-align: center;
      }

      .section-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .news-grid {
        grid-template-columns: 1fr;
      }

      .card-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-footer {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class EventosDashboardComponent implements OnInit {
  loading = true;
  recent: EventsRecent | null = null;
  wellness: EventsWellness | null = null;
  laFortuna: EventsLaFortuna | null = null;
  insights: EventsInsights | null = null;

  constructor(private observatorioService: ObservatorioService) {}

  ngOnInit(): void {
    this.loadEventsData();
    setInterval(() => this.loadEventsData(), 1800000); // 30 min
  }

  loadEventsData(): void {
    this.loading = true;
    console.log('🔄 Cargando datos de eventos y noticias...');
    
    forkJoin({
      recent: this.observatorioService.getEventsRecent(10),
      wellness: this.observatorioService.getEventsWellness(15),
      laFortuna: this.observatorioService.getEventsLaFortuna(15),
      insights: this.observatorioService.getEventsInsights()
    }).subscribe({
      next: (data) => {
        console.log('✅ Datos de eventos cargados:', data);
        this.recent = data.recent;
        this.wellness = data.wellness;
        this.laFortuna = data.laFortuna;
        this.insights = data.insights;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando eventos:', error);
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.loadEventsData();
  }

  hasAnyData(): boolean {
    return !!(
      (this.recent?.success && this.recent.news && this.recent.news.length > 0) ||
      (this.wellness?.success && this.wellness.wellness_news && this.wellness.wellness_news.length > 0) ||
      (this.laFortuna?.success && this.laFortuna.la_fortuna_news && this.laFortuna.la_fortuna_news.length > 0) ||
      (this.insights?.success && this.insights.insights)
    );
  }

  formatEventDate(dateString: string): string {
    if (!dateString) return 'Fecha por definir';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }

  formatNewsDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      
      return date.toLocaleDateString('es-CR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }

  formatTimestamp(timestamp?: string): string {
    if (!timestamp) return 'Recientemente';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-CR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recientemente';
    }
  }
}
