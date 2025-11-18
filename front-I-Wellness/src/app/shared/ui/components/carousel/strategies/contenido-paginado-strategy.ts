import { CarouselContext, CarouselStrategy } from "./interface-carousel";

export class ContenidoPaginadoStrategy implements CarouselStrategy {
  name = 'paged';
  init(ctx: CarouselContext): void {
    this.recalc(ctx);
  }
  recalc(ctx: CarouselContext): void {
    const total = Math.max(1, Math.ceil(ctx.projectedLength / ctx.itemsPerView));
    ctx.setState({ totalSlides: total, currentIndex: Math.min(ctx.currentIndex, total - 1) });
  }
  next(ctx: CarouselContext): void {
    ctx.setState({ currentIndex: (ctx.currentIndex + 1) % ctx.totalSlides });
  }
  prev(ctx: CarouselContext): void {
    ctx.setState({ currentIndex: (ctx.currentIndex - 1 + ctx.totalSlides) % ctx.totalSlides });
  }
  goTo(ctx: CarouselContext, index: number): void {
    if (index >= 0 && index < ctx.totalSlides) ctx.setState({ currentIndex: index });
  }
}
