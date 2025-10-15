export interface LinkedItem {
  id: any;
  position?: [number, number];
  data?: any;
}

export interface CarouselContext {
  itemsPerView: number;
  projectedLength: number;
  linkedItems: LinkedItem[];
  currentIndex: number;
  totalSlides: number;
  setState(p: Partial<Pick<CarouselContext,'currentIndex'|'totalSlides'>>): void;
  emitLinked?(payload: { index: number; item: LinkedItem }): void;
}

export interface CarouselStrategy {
  name: string;
  init(ctx: CarouselContext): void;
  recalc(ctx: CarouselContext): void;
  next(ctx: CarouselContext): void;
  prev(ctx: CarouselContext): void;
  goTo(ctx: CarouselContext, index: number): void;
  destroy?(ctx: CarouselContext): void;
}
