import { CarouselContext, CarouselStrategy } from "./interface-carousel";

/**
 * MapLinkedStrategy
 * Ajustada para mostrar SIEMPRE un solo proveedor por slide, independiente de itemsPerView.
 * Navegar izquierda/derecha cambia el proveedor activo y emite su selección.
 */
export class MapLinkedStrategy implements CarouselStrategy {
  name = 'map-linked';
  private _lastEmittedIndex = -1;
  private _lastDatasetSignature = '';

  init(ctx: CarouselContext): void {
    console.groupCollapsed('[MapLinkedStrategy] init - TRACKING WHY');
    console.log('linkedItems length:', ctx.linkedItems.length);
    console.log('linkedItems identity:', ctx.linkedItems); // Ver si es el mismo objeto o nuevo
    console.log('Call stack:', new Error('Trace init caller').stack); // Ver quién llamó a init
    console.table(
      ctx.linkedItems.map((it, i) => ({ i, id: (it as any)?.id, name: (it as any)?.data?.nombre_empresa || (it as any)?.data?.name || (it as any)?.title }))
    );
    console.groupEnd();
    this._lastEmittedIndex = -1; // Reset on init
    this._lastDatasetSignature = '';
    this.recalc(ctx);
    this.emit(ctx); // Emitir el primero al iniciar
  }

  recalc(ctx: CarouselContext): void {
    const signature = this.signature(ctx);
    const datasetChanged = signature !== this._lastDatasetSignature;
    if (datasetChanged) {
      this._lastDatasetSignature = signature;
      this._lastEmittedIndex = -1; // allow re-emission for fresh dataset
    }
    // Forzar totalSlides = número de proveedores (1 por slide)
    const total = Math.max(1, ctx.linkedItems.length);
    const boundedIndex = Math.min(ctx.currentIndex, total - 1);
    const changedSlides = total !== ctx.totalSlides || boundedIndex !== ctx.currentIndex;
    if (changedSlides) {
      ctx.setState({ totalSlides: total, currentIndex: boundedIndex });
      console.log('[MapLinkedStrategy] recalc', { totalSlides: total, currentIndex: boundedIndex });
    }
    if (datasetChanged && ctx.linkedItems.length) {
      // emit current item so external consumers react without requiring manual click
      this.emitExplicit(ctx, boundedIndex);
    }
  }

  next(ctx: CarouselContext): void {
    if (ctx.totalSlides <= 1) return;
    const nextIndex = (ctx.currentIndex + 1) % ctx.totalSlides;
    ctx.setState({ currentIndex: nextIndex });
    console.log('[MapLinkedStrategy] next', { from: ctx.currentIndex, to: nextIndex, totalSlides: ctx.totalSlides });
    // Emit with explicit index since ctx.currentIndex won't update until next call
    this.emitExplicit(ctx, nextIndex);
  }

  prev(ctx: CarouselContext): void {
    if (ctx.totalSlides <= 1) return;
    const prevIndex = (ctx.currentIndex - 1 + ctx.totalSlides) % ctx.totalSlides;
    ctx.setState({ currentIndex: prevIndex });
    console.log('[MapLinkedStrategy] prev', { from: ctx.currentIndex, to: prevIndex, totalSlides: ctx.totalSlides });
    // Emit with explicit index since ctx.currentIndex won't update until next call
    this.emitExplicit(ctx, prevIndex);
  }

  goTo(ctx: CarouselContext, index: number): void {
    if (index < 0 || index >= ctx.totalSlides) return;
    ctx.setState({ currentIndex: index });
    console.log('[MapLinkedStrategy] goTo', { from: ctx.currentIndex, to: index, totalSlides: ctx.totalSlides });
    // Emit with explicit index since ctx.currentIndex won't update until next call
    this.emitExplicit(ctx, index);
  }

  private emit(ctx: CarouselContext) {
    // Use current context index (for init and recalc)
    this.emitExplicit(ctx, ctx.currentIndex);
  }

  private emitExplicit(ctx: CarouselContext, absIndex: number) {
    if (!ctx.emitLinked || !ctx.linkedItems.length) return;

    if (absIndex < 0 || absIndex >= ctx.linkedItems.length) {
      console.warn('[MapLinkedStrategy] emit: index out of bounds', { absIndex, length: ctx.linkedItems.length });
      return;
    }

    const item = ctx.linkedItems[absIndex] as any;
    const name = item?.data?.nombre_empresa || item?.data?.name || item?.title;

    // Evitar emisiones redundantes: si ya emitimos el mismo índice consecutivo
    if (this._lastEmittedIndex === absIndex) {
      console.log('[MapLinkedStrategy] emit skipped (duplicate index)', { absIndex });
      return;
    }

    console.log('[MapLinkedStrategy] emit linked', { absIndex, id: item?.id, name, providerCount: ctx.linkedItems.length });
    ctx.emitLinked({ index: absIndex, item: ctx.linkedItems[absIndex] });
    this._lastEmittedIndex = absIndex;
  }

  private signature(ctx: CarouselContext): string {
    // Build lightweight identity to detect dataset swaps without deep compare
    try {
      return ctx.linkedItems.map((it: any) => String(it?.id ?? it?.data?.id ?? '')).join('|');
    } catch {
      return `len:${ctx.linkedItems.length}`;
    }
  }
}
