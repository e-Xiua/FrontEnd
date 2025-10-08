// service-card-adapter.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServiceCardConfig } from './map.service';

@Injectable({
  providedIn: 'root'
})
export class ServiceCardAdapterService {
  private showCardSubject = new BehaviorSubject<boolean>(false);
  private selectedCardSubject = new BehaviorSubject<ServiceCardConfig | null>(null);
  private allCardsSubject = new BehaviorSubject<ServiceCardConfig[]>([]);

  // Observables públicos
  showCard$: Observable<boolean> = this.showCardSubject.asObservable();
  selectedCard$: Observable<ServiceCardConfig | null> = this.selectedCardSubject.asObservable();
  allCards$: Observable<ServiceCardConfig[]> = this.allCardsSubject.asObservable();

  // Métodos para controlar la visibilidad
  showServiceCard(card: ServiceCardConfig): void {
    this.selectedCardSubject.next(card);
    this.showCardSubject.next(true);
  }

  hideServiceCard(): void {
    this.showCardSubject.next(false);
    this.selectedCardSubject.next(null);
  }

  // Método para cargar todas las cards
  loadAllCards(cards: ServiceCardConfig[]): void {
    this.allCardsSubject.next(cards);
  }

  // Método para mostrar todas las cards (grid view)
  showAllCards(): void {
    this.showCardSubject.next(false); // Oculta la card individual
    // Aquí podrías emitir otro evento para mostrar el grid
  }

  // Método para obtener una card por ID
  getCardById(id: number): ServiceCardConfig | undefined {
    return this.allCardsSubject.value.find(card =>
      (card as any).id === id || // Si tu ServiceCardConfig tiene id
      (card as any).nombre_empresa === id.toString() // O buscas por nombre
    );
  }
}
