import { CarouselContext, CarouselStrategy } from "./interface-carousel";


export class MapLinkedStrategy implements CarouselStrategy {
  name = 'map-linked';
  init(ctx: CarouselContext): void {
    this.recalc(ctx);
    this.emit(ctx);
  }
  recalc(ctx: CarouselContext): void {
    // Se basa en linkedItems, ignora projectedLength
    const total = Math.max(1, Math.ceil(ctx.linkedItems.length / ctx.itemsPerView));
    ctx.setState({ totalSlides: total, currentIndex: Math.min(ctx.currentIndex, total - 1) });
  }
  next(ctx: CarouselContext): void {
    ctx.setState({ currentIndex: (ctx.currentIndex + 1) % ctx.totalSlides });
    this.emit(ctx);
  }
  prev(ctx: CarouselContext): void {
    ctx.setState({ currentIndex: (ctx.currentIndex - 1 + ctx.totalSlides) % ctx.totalSlides });
    this.emit(ctx);
  }
  goTo(ctx: CarouselContext, index: number): void {
    if (index >= 0 && index < ctx.totalSlides) {
      ctx.setState({ currentIndex: index });
      this.emit(ctx);
    }
  }
  private emit(ctx: CarouselContext) {
    if (!ctx.emitLinked || !ctx.linkedItems.length) return;
    const abs = Math.min(ctx.currentIndex * ctx.itemsPerView, ctx.linkedItems.length - 1);
    ctx.emitLinked({ index: abs, item: ctx.linkedItems[abs] });
  }
}
