import { CommonModule } from '@angular/common';
import {
  AfterContentChecked,
  AfterContentInit,
  ChangeDetectorRef, Component, ContentChildren, ElementRef,
  EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { RouteBuilderStateService } from '../../../services/route-builder-state.service';
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
export class CarouselComponent implements AfterContentInit, AfterContentChecked, OnDestroy, OnChanges {

  @Input() title = '';
  @Input() description = '';
  @Input() itemsPerView = 2;
  @Input() mode: 'paged' | 'map-linked' = 'paged';
  @Input() linkedItems: LinkedItem[] = [];
  @Input() showHeader = true;
  // Si true y mode=map-linked, sincroniza con RouteBuilderStateService (id proveedor activo)
  @Input() syncWithRouteBuilder = false;
  @Output() linkedItemChange = new EventEmitter<{ index: number; item: LinkedItem }>();

  @ContentChildren(CarouselItemDirective) items!: QueryList<CarouselItemDirective>;
  // Usamos la referencia al contenedor real en template (#carouselContainer)
  @ViewChild('carouselContainer') trackRef!: ElementRef;

  currentIndex = 0;
  totalSlides = 0;
  isAnimating = false;

  private itemsSub?: Subscription;
  private strategy!: CarouselStrategy;
  private lastItemsCount = 0;
  private lastItemsPerView = this.itemsPerView;
  private lastMode: 'paged' | 'map-linked' = this.mode;
  private recalcScheduled = false;
  private originalItemsPerView = this.itemsPerView;
  @Input() autoResponsive = true; // habilita ajuste dinámico según ancho
  private initialized = false;
  private stateSub?: Subscription;
  private suppressStateSync = false;
  private lastActiveProviderId: number | null = null;

  constructor(private readonly cdr: ChangeDetectorRef, private readonly routeBuilderState?: RouteBuilderStateService) {}

  ngAfterContentInit(): void {
    this.pickStrategy();
    this.itemsSub = this.items?.changes.subscribe(() => this.recalc());
    this.recalc();
    this.originalItemsPerView = this.itemsPerView; // guardar valor base
    this.evaluateResponsive('after-content-init');
    this.snapshotState('afterContentInit');
    this.initialized = true;
    this.setupStateSync();
  }

  ngAfterContentChecked(): void {
    // Detect dynamic addition/removal of projected carousel items
    const currentCount = this.items?.length ?? 0;
    if (currentCount !== this.lastItemsCount && !this.recalcScheduled) {
      console.log('[Carousel] Detected projected items length change', { from: this.lastItemsCount, to: currentCount });
      this.recalcScheduled = true;
      Promise.resolve().then(() => {
        this.recalc('projected-length-change');
        this.recalcScheduled = false;
      });
    }
    // Detect change in itemsPerView not caught by OnChanges (e.g., bound expression resolving later)
    if (this.itemsPerView !== this.lastItemsPerView && !this.recalcScheduled) {
      console.log('[Carousel] itemsPerView changed async', { from: this.lastItemsPerView, to: this.itemsPerView });
      this.recalc('itemsPerView-async-change');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Evitar ejecutar estrategia/recalc antes de que el contenido esté listo
    if (!this.initialized) {
      // Permitir que AfterContentInit se encargue de inicializar la estrategia
      return;
    }
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.pickStrategy();
      this.recalc('mode-changed');
      this.setupStateSync();
    }
    if (changes['linkedItems'] && this.mode === 'map-linked') {
      console.log('[Carousel] linkedItems changed', {
        firstChange: changes['linkedItems'].firstChange,
        previousLength: changes['linkedItems'].previousValue?.length,
        currentLength: changes['linkedItems'].currentValue?.length,
        previousIdentity: changes['linkedItems'].previousValue,
        currentIdentity: changes['linkedItems'].currentValue,
        sameArray: changes['linkedItems'].previousValue === changes['linkedItems'].currentValue
      });
      this.ensureStrategy();
      this.recalc('linked-items-changed');
      // Alinear índice con proveedor activo si hay sincronización
      this.alignWithActiveProvider('linked-items-changed');
    }
    if (changes['itemsPerView'] && !changes['itemsPerView'].firstChange) {
      // si el usuario cambia manualmente itemsPerView, actualizar base responsive
      this.originalItemsPerView = changes['itemsPerView'].currentValue;
      this.recalc('itemsPerView-changed');
      this.evaluateResponsive('itemsPerView-change');
    }
  }

  ngOnDestroy(): void {
    this.itemsSub?.unsubscribe();
    this.strategy?.destroy?.(this.context());
    this.stateSub?.unsubscribe();
  }

  private pickStrategy() {
    console.log('[Carousel] pickStrategy called - TRACKING', {
      mode: this.mode,
      linkedItemsLength: this.linkedItems.length,
      linkedItemsIdentity: this.linkedItems,
      initialized: this.initialized,
      callStack: new Error('Trace pickStrategy caller').stack
    });
    this.strategy = this.mode === 'map-linked'
      ? new MapLinkedStrategy()
      : new ContenidoPaginadoStrategy();
    // Forzar vista de un solo proveedor cuando es map-linked
    if (this.mode === 'map-linked' && this.itemsPerView !== 1) {
      console.log('[Carousel] Forzando itemsPerView=1 para modo map-linked (antes:', this.itemsPerView, ')');
      this.itemsPerView = 1;
    }
    this.strategy.init(this.context());
    if (this.mode === 'map-linked') {
      console.groupCollapsed('[Carousel map-linked] providers snapshot');
      console.table(this.linkedItems.map((it:any, i) => ({
        slide: i,
        id: it?.id,
        name: it?.data?.nombre_empresa || it?.data?.name || it?.title,
        lat: it?.position?.[0],
        lng: it?.position?.[1]
      })));
      console.groupEnd();
    }
  }

  private ensureStrategy() {
    if (!this.strategy) {
      try { this.pickStrategy(); } catch {}
    }
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
      emitLinked: payload => {
        // Enviar al exterior
        this.linkedItemChange.emit(payload);
        // Si hay sincronización con estado de rutas y estamos en modo map-linked, propagar selección
        if (this.syncWithRouteBuilder && this.routeBuilderState && this.mode === 'map-linked') {
          const id = (payload.item as any)?.id;
          if (id !== undefined && id !== null) {
            this.suppressStateSync = true;
            try {
              this.routeBuilderState.setActiveProvider(Number(id));
              this.lastActiveProviderId = Number(id);
            } finally {
              // Evitar loop: liberamos la supresión en el siguiente tick
              setTimeout(() => { this.suppressStateSync = false; }, 0);
            }
          }
        }
      }
    };
  }

  public recalc(reason: string = 'manual') {
    if (!this.strategy) {
      // Reintentar inicialización perezosa
      this.ensureStrategy();
    }
    if (!this.strategy) {
      console.warn('[Carousel] recalc ignorado: estrategia no inicializada. Razón:', reason);
      return;
    }
    const before = { totalSlides: this.totalSlides, currentIndex: this.currentIndex, projected: this.items?.length ?? 0 };
    this.strategy.recalc(this.context());
    const after = { totalSlides: this.totalSlides, currentIndex: this.currentIndex, projected: this.items?.length ?? 0 };
    console.log('[Carousel] recalc', { reason, before, after, mode: this.mode, itemsPerView: this.itemsPerView });
    if (this.mode === 'map-linked') {
      console.log('[Carousel map-linked] recalc detail', {
        totalSlides: this.totalSlides,
        activeIndex: this.currentIndex,
        activeProvider: this.linkedItems[this.currentIndex] ? (this.linkedItems[this.currentIndex] as any).data?.nombre_empresa || (this.linkedItems[this.currentIndex] as any).data?.name || (this.linkedItems[this.currentIndex] as any).title : null
      });
    }
    // Debug layout insight: how many templates and effective columns
    if (this.pagedMode) {
      const effectiveColumns = this.itemsPerView;
      console.log('[Carousel] layout debug', {
        projectedTemplates: this.items?.length ?? 0,
        itemsPerView: this.itemsPerView,
        effectiveColumns,
        totalSlides: this.totalSlides
      });
    }
    // Adjust currentIndex if it overflowed (strategy should handle, but defensive)
    if (this.currentIndex >= this.totalSlides) {
      this.currentIndex = Math.max(0, this.totalSlides - 1);
    }
    this.snapshotState('recalc');
    this.cdr.markForCheck();
  }

  private snapshotState(context: string) {
    this.lastItemsCount = this.items?.length ?? 0;
    this.lastItemsPerView = this.itemsPerView;
    this.lastMode = this.mode;
    console.log('[Carousel] snapshot', { context, count: this.lastItemsCount, itemsPerView: this.lastItemsPerView, mode: this.lastMode });
  }

  nextSlide() {
    if (this.totalSlides <= 1) {
      console.log('[Carousel] nextSlide ignored: only one slide', { totalSlides: this.totalSlides });
      return;
    }
    this.ensureStrategy();
    if (!this.strategy) return;
    if (this.isAnimating) {
      console.log('[Carousel] nextSlide ignored: still animating');
      return;
    }
    this.animate(() => {
      const prev = this.currentIndex;
      this.strategy.next(this.context());
      console.log('[Carousel] nextSlide', { from: prev, to: this.currentIndex });
      if (this.mode === 'map-linked') {
        console.log('[Carousel map-linked] moved to provider', {
          index: this.currentIndex,
          name: (this.linkedItems[this.currentIndex] as any)?.data?.nombre_empresa || (this.linkedItems[this.currentIndex] as any)?.data?.name || (this.linkedItems[this.currentIndex] as any)?.title
        });
      }
    });
  }

  prevSlide() {
    if (this.totalSlides <= 1) {
      console.log('[Carousel] prevSlide ignored: only one slide', { totalSlides: this.totalSlides });
      return;
    }
    this.ensureStrategy();
    if (!this.strategy) return;
    if (this.isAnimating) {
      console.log('[Carousel] prevSlide ignored: still animating');
      return;
    }
    this.animate(() => {
      const prev = this.currentIndex;
      this.strategy.prev(this.context());
      console.log('[Carousel] prevSlide', { from: prev, to: this.currentIndex });
      if (this.mode === 'map-linked') {
        console.log('[Carousel map-linked] moved to provider', {
          index: this.currentIndex,
          name: (this.linkedItems[this.currentIndex] as any)?.data?.nombre_empresa || (this.linkedItems[this.currentIndex] as any)?.data?.name || (this.linkedItems[this.currentIndex] as any)?.title
        });
      }
    });
  }

  goToSlide(i: number) {
    if (i === this.currentIndex) {
      console.log('[Carousel] goToSlide ignored: already at index', i);
      return;
    }
    this.ensureStrategy();
    if (!this.strategy) return;
    if (this.isAnimating) {
      console.log('[Carousel] goToSlide ignored: animating');
      return;
    }
    if (i < 0 || i >= this.totalSlides) {
      console.warn('[Carousel] goToSlide out of bounds', { requested: i, totalSlides: this.totalSlides });
      return;
    }
    this.animate(() => {
      const prev = this.currentIndex;
      this.strategy.goTo(this.context(), i);
      console.log('[Carousel] goToSlide', { from: prev, to: this.currentIndex });
      if (this.mode === 'map-linked') {
        console.log('[Carousel map-linked] jumped to provider', {
          index: this.currentIndex,
          name: (this.linkedItems[this.currentIndex] as any)?.data?.nombre_empresa || (this.linkedItems[this.currentIndex] as any)?.data?.name || (this.linkedItems[this.currentIndex] as any)?.title
        });
      }
    });
  }

  private animate(action: () => void) {
    this.isAnimating = true;
    try {
      action();
    } finally {
      setTimeout(() => {
        this.isAnimating = false;
        this.cdr.markForCheck();
        // Safety watchdog: if still flagged later, clear and log
        setTimeout(() => {
          if (this.isAnimating) {
            console.warn('[Carousel] Animation flag stuck. Forcing reset.');
            this.isAnimating = false;
            this.cdr.markForCheck();
          }
        }, 400);
      }, 350);
    }
  }

  onLinkedCardSelect(event: Event, index: number, item: LinkedItem): void {
    event.preventDefault();
    this.linkedItemChange.emit({ index, item });
  }

  // helpers para template
  get slideArray(): number[] {
    return Array.from({ length: this.totalSlides }, (_, i) => i);
  }

  get pagedMode(): boolean {
    return this.mode === 'paged';
  }

  // ================== RESPONSIVE LOGIC ==================
  @HostListener('window:resize')
  onWindowResize() {
    this.evaluateResponsive('window-resize');
  }

  private evaluateResponsive(origin: string) {
    // No responsive para modo map-linked (siempre 1)
    if (this.mode === 'map-linked') return;
    if (!this.autoResponsive || !this.pagedMode) return;
    try {
      const width = this.trackRef?.nativeElement?.offsetWidth || window.innerWidth;
      // breakpoints: <520px => 1, >=1200px => 3, si no => valor base
      const small = 520;
      const large = 1200;
      let target = this.originalItemsPerView;
      if (width < small) target = 1;
      else if (width >= large) target = 3;
      if (target !== this.itemsPerView) {
        const prev = this.itemsPerView;
        this.itemsPerView = target;
        console.log('[Carousel] responsive change', { origin, width, prev, next: target, small, large });
        this.recalc('responsive-breakpoint');
      }
    } catch (e) {
      console.warn('[Carousel] responsive evaluation error', e);
    }
  }

  // ================== SINCRONIZACIÓN CON ROUTE BUILDER ==================
  private setupStateSync() {
    this.stateSub?.unsubscribe();
    if (!this.syncWithRouteBuilder || !this.routeBuilderState || this.mode !== 'map-linked') {
      return;
    }
    this.stateSub = this.routeBuilderState.activeProviderId$.subscribe((id) => {
      // Normalizar id a número o null
      if (typeof id === 'number') {
        this.lastActiveProviderId = id;
      } else if (id == null) {
        this.lastActiveProviderId = null;
      } else {
        this.lastActiveProviderId = Number(id);
      }
      if (this.suppressStateSync) return; // evitando eco
      if (this.lastActiveProviderId == null) return;
      // Buscar índice correspondiente en linkedItems
      const idx = this.linkedItems.findIndex((it: any) => Number(it?.id) === this.lastActiveProviderId);
      if (idx >= 0 && idx !== this.currentIndex) {
        // Ir directamente al índice
        this.goToSlide(idx);
      }
    });
    // Intentar alinear inmediatamente si ya existe un activo
    this.alignWithActiveProvider('setup-sync');
  }

  private alignWithActiveProvider(origin: string) {
    if (!this.syncWithRouteBuilder || !this.routeBuilderState || this.mode !== 'map-linked') return;
    // Usaremos la última id observada (si se recibió algo antes de linkedItems)
    if (this.lastActiveProviderId == null) return;
    const idx = this.linkedItems.findIndex((it: any) => Number(it?.id) === this.lastActiveProviderId);
    if (idx >= 0 && idx !== this.currentIndex) {
      console.log('[Carousel] alignWithActiveProvider', { origin, activeId: this.lastActiveProviderId, toIndex: idx });
      this.goToSlide(idx);
    }
  }
}
