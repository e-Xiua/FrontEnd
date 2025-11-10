import { CommonModule } from '@angular/common';
import {
  AfterContentInit, ChangeDetectorRef, Component, ContentChildren, ElementRef,
  EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CarouselItemDirective } from './carousel-item.directive';
import { ContenidoPaginadoStrategy } from './strategies/contenido-paginado-strategy';
import { CarouselContext, CarouselStrategy, LinkedItem } from './strategies/interface-carousel';
import { MapLinkedStrategy } from './strategies/map-linked-strategy';


@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})
export class CarouselComponent implements AfterContentInit, OnDestroy, OnChanges {

  @Input() title = '';
  @Input() description = '';
  @Input() itemsPerView = 2;
  @Input() mode: 'paged' | 'map-linked' = 'paged';
  @Input() linkedItems: LinkedItem[] = [];
  @Input() showHeader = true;
  @Output() linkedItemChange = new EventEmitter<{ index: number; item: LinkedItem }>();

  @ContentChildren(CarouselItemDirective) items!: QueryList<CarouselItemDirective>;
  @ViewChild('track') trackRef!: ElementRef;

  currentIndex = 0;
  totalSlides = 0;
  isAnimating = false;

  private itemsSub?: Subscription;
  private strategy!: CarouselStrategy;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterContentInit(): void {
    this.pickStrategy();
    this.itemsSub = this.items?.changes.subscribe(() => this.recalc());
    this.recalc();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.pickStrategy();
      this.recalc();
    }
    if (changes['linkedItems'] && this.mode === 'map-linked') {
      this.recalc();
    }
  }

  ngOnDestroy(): void {
    this.itemsSub?.unsubscribe();
    this.strategy?.destroy?.(this.context());
  }

  private pickStrategy() {
    console.log('Seleccionando estrategia para modo:', this.mode);
    this.strategy = this.mode === 'map-linked'
      ? new MapLinkedStrategy()
      : new ContenidoPaginadoStrategy();
    this.strategy.init(this.context());
  }

  private setState(p: Partial<Pick<CarouselContext, 'currentIndex' | 'totalSlides'>>) {
    if (p.currentIndex !== undefined) this.currentIndex = p.currentIndex;
    if (p.totalSlides !== undefined) this.totalSlides = p.totalSlides;
    this.cdr.markForCheck();
  }

  private context(): CarouselContext {
    return {
      itemsPerView: this.itemsPerView,
      projectedLength: this.items?.length ?? 0,
      linkedItems: this.linkedItems,
      currentIndex: this.currentIndex,
      totalSlides: this.totalSlides,
      setState: s => this.setState(s),
      emitLinked: payload => this.linkedItemChange.emit(payload)
    };
  }

  public recalc() {
    this.strategy.recalc(this.context());
    this.cdr.markForCheck();
  }

  nextSlide() {
    if (this.isAnimating || this.totalSlides <= 1) return;
    this.animate(() => this.strategy.next(this.context()));
  }

  prevSlide() {
    if (this.isAnimating || this.totalSlides <= 1) return;
    this.animate(() => this.strategy.prev(this.context()));
  }

  goToSlide(i: number) {
    if (this.isAnimating || i === this.currentIndex) return;
    this.animate(() => this.strategy.goTo(this.context(), i));
  }

  private animate(action: () => void) {
    this.isAnimating = true;
    action();
    setTimeout(() => (this.isAnimating = false), 350);
  }

  // helpers para template
  get slideArray(): number[] {
    return Array.from({ length: this.totalSlides }, (_, i) => i);
  }

  get pagedMode(): boolean {
    return this.mode === 'paged';
  }
}
