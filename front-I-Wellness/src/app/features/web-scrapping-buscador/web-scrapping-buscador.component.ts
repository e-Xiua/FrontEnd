import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './web-scrapping-buscador.component.html',
  styleUrls: ['./web-scrapping-buscador.component.css']
})
export class WebScrappingBuscadorComponent {
  private http = inject(HttpClient);
  
  searchResults: SearchResult | null = null;
  buscando = false;
  error = '';
  currentTab = 'matches';
  searchTerm = '';

  // Términos sugeridos
  suggestedTerms = ['precio', 'clima', 'spa', 'hotel', 'actividades'];

  buscar(query: string) {
    if (!query.trim()) return;
    
    this.buscando = true;
    this.searchResults = null;
    this.error = '';
    this.searchTerm = query;
    
    // Llamada al backend web scrapping - Puerto 8080 como está configurado en server.py
    this.http.get<SearchResult>(`http://localhost:8085/api/search?term=${encodeURIComponent(query)}`)
      .subscribe({
        next: (data) => {
          this.searchResults = data;
          this.buscando = false;
        },
        error: (err) => {
          this.error = 'No se pudo obtener resultados. Asegúrate de que el servidor esté ejecutándose en puerto 8080.';
          this.buscando = false;
          console.error('Error de búsqueda:', err);
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
