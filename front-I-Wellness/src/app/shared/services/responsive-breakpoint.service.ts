import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { LayoutAdapterService } from './layout-adapter.service';

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Servicio Detector de Breakpoints Responsive
 * Se integra con LayoutAdapterService para ajustar automáticamente el layout
 */
@Injectable({
  providedIn: 'root'
})
export class ResponsiveBreakpointService implements OnDestroy {
  private readonly MOBILE_BREAKPOINT = 768;
  private readonly TABLET_BREAKPOINT = 1024;

  private breakpointSubject = new BehaviorSubject<BreakpointState>(
    this.getCurrentBreakpointState()
  );

  public breakpoint$ = this.breakpointSubject.asObservable();

  public isMobile$ = this.breakpoint$.pipe(
    map(bp => bp.isMobile),
    distinctUntilChanged()
  );

  public isTablet$ = this.breakpoint$.pipe(
    map(bp => bp.isTablet),
    distinctUntilChanged()
  );

  public isDesktop$ = this.breakpoint$.pipe(
    map(bp => bp.isDesktop),
    distinctUntilChanged()
  );

  constructor(private layoutAdapter: LayoutAdapterService) {
    this.initializeBreakpointDetection();
  }

  private initializeBreakpointDetection(): void {
    // Escuchar cambios en el tamaño de la ventana
    fromEvent(window, 'resize').pipe(
      debounceTime(250),
      startWith(null),
      map(() => this.getCurrentBreakpointState()),
      distinctUntilChanged((prev, curr) =>
        prev.isMobile === curr.isMobile &&
        prev.isTablet === curr.isTablet &&
        prev.isDesktop === curr.isDesktop
      )
    ).subscribe(breakpointState => {
      this.breakpointSubject.next(breakpointState);
      this.applyResponsiveLayout(breakpointState);
    });
  }

  private getCurrentBreakpointState(): BreakpointState {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    return {
      isMobile: screenWidth < this.MOBILE_BREAKPOINT,
      isTablet: screenWidth >= this.MOBILE_BREAKPOINT && screenWidth < this.TABLET_BREAKPOINT,
      isDesktop: screenWidth >= this.TABLET_BREAKPOINT,
      screenWidth,
      screenHeight
    };
  }

  private applyResponsiveLayout(breakpoint: BreakpointState): void {
    if (breakpoint.isMobile) {
      this.layoutAdapter.setMobileLayout();
    } else if (breakpoint.isTablet) {
      this.layoutAdapter.setTabletLayout();
    } else {
      this.layoutAdapter.setDesktopLayout();
    }
  }

  /**
   * Obtiene el estado actual del breakpoint
   */
  getCurrentBreakpoint(): BreakpointState {
    return this.breakpointSubject.value;
  }

  /**
   * Verifica si estamos en un breakpoint específico
   */
  isMobile(): boolean {
    return this.getCurrentBreakpoint().isMobile;
  }

  isTablet(): boolean {
    return this.getCurrentBreakpoint().isTablet;
  }

  isDesktop(): boolean {
    return this.getCurrentBreakpoint().isDesktop;
  }

  /**
   * Observable que emite cuando cambia a mobile
   */
  get onMobileChange$(): Observable<boolean> {
    return this.isMobile$;
  }

  /**
   * Observable que emite cuando cambia a tablet
   */
  get onTabletChange$(): Observable<boolean> {
    return this.isTablet$;
  }

  /**
   * Observable que emite cuando cambia a desktop
   */
  get onDesktopChange$(): Observable<boolean> {
    return this.isDesktop$;
  }

  ngOnDestroy(): void {
    // El servicio se limpia automáticamente con los operadores takeUntil en otros componentes
  }
}
