import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { LayoutAdapterComponent } from '../../../../shared/components/layout-adapter/layout-adapter.component';
import { UniversalHeaderComponent } from '../../../../shared/components/universal-header/universal-header.component';
import { ChatIntegrationService } from '../../../../shared/services/chat-integration.service';
import { ChatLayoutService } from '../../../../shared/services/chat-layout.service';
import { LayoutAdapterService } from '../../../../shared/services/layout-adapter.service';
import { ResponsiveBreakpointService } from '../../../../shared/services/responsive-breakpoint.service';
import { ChatLayoutComponent } from '../../../chat/components/chat-layout/chat-layout.component';

@Component({
  selector: 'app-proveedor-layout',
  standalone: true,
  imports: [CommonModule, ChatLayoutComponent, RouterOutlet, UniversalHeaderComponent, LayoutAdapterComponent],
  template: `
    <div class="proveedor-layout-container">
      <!-- Header fijo en la parte superior -->
      <app-universal-header
        role="proveedor"
        [ngStyle]="headerStyles"
        class="layout-header">
      </app-universal-header>

      <!-- Contenedor para chat layout y contenido principal debajo del header -->
      <div class="layout-body" [ngStyle]="bodyStyles">
        <!-- Chat layout con estilos adaptativos -->
        <app-chat-layout
          [enableSidebar]="true"
          [enableModal]="true"
          [autoLoadProviders]="true"
          [sidebarDefaultVisible]="true"
          [modalDefaultVisible]="false"
          [ngStyle]="chatLayoutStyles"
          class="layout-sidebar">
        </app-chat-layout>

        <!-- Contenido principal con adaptador de layout -->
        <app-layout-adapter
          [adaptForSidebar]="true"
          [adaptForHeader]="false"
          [adaptForModal]="true"
          class="layout-content">
          <main class="main-content">
            <router-outlet></router-outlet>
          </main>
        </app-layout-adapter>
      </div>
    </div>
  `,
  styles: [`
    .proveedor-layout-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: transparent;
      width: 100%;
    }

    .layout-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999;
      height: 64px;
    }

    .layout-body {
      display: flex;
      flex: 1;
      min-height: calc(100vh - 64px);
      margin-top: 64px;
    }

    .layout-sidebar {
      flex: 0 0 auto;
      height: calc(100vh - 64px);
      position: sticky;
      top: 64px;
    }

    .layout-content {
      flex: 1;
      min-width: 0;
      overflow-x: auto;
    }

    .main-content {
      padding: 1rem;
      min-height: 100%;
      width: 100%;
      background: transparent;
    }

    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .main-content {
        padding: 0.5rem;
      }

      .layout-body {
        flex-direction: column;
      }

      .layout-sidebar {
        height: auto;
        position: relative;
        top: 0;
      }
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 0.25rem;
      }
    }

    /* Asegurar que el layout funcione correctamente */
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class ProveedorLayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  headerStyles: any = {};
  chatLayoutStyles: any = {};
  bodyStyles: any = { marginTop: '64px' };
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private chatLayoutService: ChatLayoutService,
    private chatIntegrationService: ChatIntegrationService,
    private layoutAdapter: LayoutAdapterService,
    private responsiveBreakpoint: ResponsiveBreakpointService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar autenticación y rol usando el integration service
    this.chatIntegrationService.checkRoleAndRedirect();

    // Suscribirse a estilos adaptativos del header
    this.layoutAdapter.headerStyle$
      .pipe(takeUntil(this.destroy$))
      .subscribe(styles => {
        this.headerStyles = styles;
      });

    // Suscribirse a estilos adaptativos del chat layout
    this.layoutAdapter.chatLayoutStyle$
      .pipe(takeUntil(this.destroy$))
      .subscribe(styles => {
        this.chatLayoutStyles = styles;
      });

    // Inicializar chat para proveedores
    if (this.chatIntegrationService.initializeChatForProvider()) {
      // Suscribirse a cambios en el estado del sidebar y sincronizar con layout adapter
      this.chatLayoutService.state$
        .pipe(takeUntil(this.destroy$))
        .subscribe((state: any) => {
          this.sidebarCollapsed = state.sidebarCollapsed;

          // Sincronizar estado con el layout adapter
          this.layoutAdapter.updateSidebarState(
            state.sidebarVisible,
            state.sidebarCollapsed
          );

          // Sincronizar estado del modal si existe
          if (state.modalVisible !== undefined) {
            this.layoutAdapter.updateModalState(state.modalVisible);
          }
        });
    } else {
      // Error en la inicialización, redirigir
      this.chatIntegrationService.handleNavigationError(new Error('Chat initialization failed'));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Deshabilitar chat al salir
    this.chatIntegrationService.disableChat();

    // Resetear layout adapter
    this.layoutAdapter.reset();
  }
}
