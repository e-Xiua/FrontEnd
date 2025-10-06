import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

/**
 * Configuración de layout dinámico
 */
export interface LayoutDimensions {
  sidebarWidth: number;
  headerHeight: number;
  modalOffset: number;
  contentPadding: number;
}

export interface LayoutState {
  sidebarVisible: boolean;
  sidebarCollapsed: boolean;
  modalVisible: boolean;
  dimensions: LayoutDimensions;
  adaptiveLayout: AdaptiveLayoutConfig;
}

export interface AdaptiveLayoutConfig {
  mainContentMarginLeft: number;
  mainContentPaddingTop: number;
  headerZIndex: number;
  modalZIndex: number;
  sidebarZIndex: number;
}

/**
 * Servicio Adaptador de Layout Dinámico
 * Implementa el patrón Observer + Adapter para ajustar automáticamente
 * el layout basado en el estado de los componentes chat
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutAdapterService {
  private readonly DEFAULT_DIMENSIONS: LayoutDimensions = {
    sidebarWidth: 360,
    headerHeight: 64,
    modalOffset: 20,
    contentPadding: 16
  };

  private stateSubject = new BehaviorSubject<LayoutState>({
    sidebarVisible: true,
    sidebarCollapsed: false,
    modalVisible: false,
    dimensions: this.DEFAULT_DIMENSIONS,
    adaptiveLayout: this.calculateAdaptiveLayout(true, false, false)
  });

  public layoutState$ = this.stateSubject.asObservable();

  // Observables específicos para diferentes partes del layout
  public mainContentStyle$ = this.layoutState$.pipe(
    map(state => ({
      marginLeft: `${state.adaptiveLayout.mainContentMarginLeft}px`,
      paddingTop: `${state.adaptiveLayout.mainContentPaddingTop}px`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    })),
    distinctUntilChanged((prev, curr) =>
      prev.marginLeft === curr.marginLeft &&
      prev.paddingTop === curr.paddingTop
    )
  );

  public headerStyle$ = this.layoutState$.pipe(
    map(state => ({
      zIndex: state.adaptiveLayout.headerZIndex,
      width: '100%',
      position: 'fixed' as const,
      top: '0',
      left: '0'
    })),
    distinctUntilChanged()
  );

  public chatLayoutStyle$ = this.layoutState$.pipe(
    map(state => ({
      zIndex: state.adaptiveLayout.sidebarZIndex,
      transform: state.sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    })),
    distinctUntilChanged()
  );

  public modalStyle$ = this.layoutState$.pipe(
    map(state => ({
      zIndex: state.adaptiveLayout.modalZIndex,
      transform: state.modalVisible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    })),
    distinctUntilChanged()
  );

  constructor() {}

  /**
   * Actualiza el estado del sidebar
   */
  updateSidebarState(visible: boolean, collapsed: boolean = false): void {
    const currentState = this.stateSubject.value;
    const newAdaptiveLayout = this.calculateAdaptiveLayout(
      visible,
      collapsed,
      currentState.modalVisible,
      currentState.dimensions
    );

    this.stateSubject.next({
      ...currentState,
      sidebarVisible: visible,
      sidebarCollapsed: collapsed,
      adaptiveLayout: newAdaptiveLayout
    });
  }

  /**
   * Actualiza el estado del modal
   */
  updateModalState(visible: boolean): void {
    const currentState = this.stateSubject.value;
    const newAdaptiveLayout = this.calculateAdaptiveLayout(
      currentState.sidebarVisible,
      currentState.sidebarCollapsed,
      visible,
      currentState.dimensions
    );

    this.stateSubject.next({
      ...currentState,
      modalVisible: visible,
      adaptiveLayout: newAdaptiveLayout
    });
  }

  /**
   * Actualiza las dimensiones del layout
   */
  updateDimensions(dimensions: Partial<LayoutDimensions>): void {
    const currentState = this.stateSubject.value;
    const newDimensions = { ...currentState.dimensions, ...dimensions };

    const newAdaptiveLayout = this.calculateAdaptiveLayout(
      currentState.sidebarVisible,
      currentState.sidebarCollapsed,
      currentState.modalVisible,
      newDimensions
    );

    this.stateSubject.next({
      ...currentState,
      dimensions: newDimensions,
      adaptiveLayout: newAdaptiveLayout
    });
  }

  /**
   * Configuraciones responsive predefinidas
   */
  setMobileLayout(): void {
    this.updateDimensions({
      sidebarWidth: 280,
      headerHeight: 56,
      contentPadding: 8
    });
    this.updateSidebarState(false, true);
  }

  setTabletLayout(): void {
    this.updateDimensions({
      sidebarWidth: 320,
      headerHeight: 60,
      contentPadding: 12
    });
    this.updateSidebarState(true, true);
  }

  setDesktopLayout(): void {
    this.updateDimensions(this.DEFAULT_DIMENSIONS);
    this.updateSidebarState(true, false);
  }

  /**
   * Obtiene el estado actual
   */
  getCurrentState(): LayoutState {
    return this.stateSubject.value;
  }

  /**
   * Resetea el layout a valores por defecto
   */
  reset(): void {
    this.stateSubject.next({
      sidebarVisible: true,
      sidebarCollapsed: false,
      modalVisible: false,
      dimensions: this.DEFAULT_DIMENSIONS,
      adaptiveLayout: this.calculateAdaptiveLayout(true, false, false)
    });
  }

  /**
   * Calcula la configuración adaptativa del layout
   */
  private calculateAdaptiveLayout(
    sidebarVisible: boolean,
    sidebarCollapsed: boolean,
    modalVisible: boolean,
    dimensions: LayoutDimensions = this.DEFAULT_DIMENSIONS
  ): AdaptiveLayoutConfig {
    let mainContentMarginLeft = 0;

    if (sidebarVisible) {
      mainContentMarginLeft = sidebarCollapsed ? 80 : dimensions.sidebarWidth;
    }

    return {
      mainContentMarginLeft,
      mainContentPaddingTop: dimensions.headerHeight + dimensions.contentPadding,
      headerZIndex: 1100,
      modalZIndex: modalVisible ? 1300 : 1200,
      sidebarZIndex: 1000
    };
  }
}
