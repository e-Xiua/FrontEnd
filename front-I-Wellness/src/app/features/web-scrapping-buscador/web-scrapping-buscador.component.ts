import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { ObservatorioService } from '../../shared/services/observatorio.service';
import { UniversalHeaderComponent } from '../../shared/components/universal-header/universal-header.component';

interface SearchResult {
  search_term: string;
  search_timestamp: string;
  total_matches: number;
  sources_searched: number;
  sources_with_results: number;
  variations_found: number;
  matches: Match[];
  summary: Summary;
  sources_breakdown: SourceBreakdown[];
}

interface Match {
  search_term: string;
  found_variation: string;
  snippet: string;
  context_before: string;
  context_after: string;
  full_context: string;
  source_url: string;
  source_title: string;
  position: number;
  found_at: string;
}

interface Summary {
  total_results: number;
  unique_sources: number;
  top_source: {
    url: string;
    matches: number;
  };
  average_context_length: number;
}

interface SourceBreakdown {
  title: string;
  url: string;
  matches_count: number;
  sample_contexts: {
    snippet: string;
    context: string;
  }[];
}

@Component({
  selector: 'app-web-scrapping-buscador',
  standalone: true,
  imports: [CommonModule, FormsModule, UniversalHeaderComponent],
  templateUrl: './web-scrapping-buscador.component.html',
  styleUrls: ['./web-scrapping-buscador.component.css']
})
export class WebScrappingBuscadorComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private observatorioService = inject(ObservatorioService);
  
  searchResults: SearchResult | null = null;
  buscando = false;
  error = '';
  currentTab = 'matches';
  searchTerm = '';
  userRole: 'admin' | 'proveedor' | 'turista' | 'public' = 'public';

  // Términos sugeridos
  suggestedTerms = ['precio', 'clima', 'spa', 'hotel', 'actividades'];

  ngOnInit(): void {
    // Determinar el rol del usuario para el header
    if (this.authService.isAuthenticated()) {
      const rol = localStorage.getItem('rol');
      switch (rol) {
        case 'Admin':
          this.userRole = 'admin';
          break;
        case 'Proveedor':
          this.userRole = 'proveedor';
          break;
        case 'Turista':
          this.userRole = 'turista';
          break;
        default:
          this.userRole = 'public';
      }
    } else {
      this.userRole = 'public';
    }
  }

  buscar(query: string): void {
    if (!query.trim()) {
      this.error = 'Por favor ingrese un término de búsqueda';
      return;
    }

    this.buscando = true;
    this.error = '';
    this.searchResults = null;

    this.observatorioService.searchTourismParameter(query).subscribe({
      next: (data: SearchResult) => {
        this.searchResults = data;
        this.buscando = false;
      },
      error: (err: Error) => {
        this.error = 'Error al realizar la búsqueda: ' + (err.message || 'Error desconocido');
        this.buscando = false;
      }
    });
  }

  searchSuggestion(term: string) {
    this.buscar(term);
  }

  changeTab(tab: string) {
    this.currentTab = tab;
  }

  highlightTerm(text: string, term: string): string {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES');
  }
}
