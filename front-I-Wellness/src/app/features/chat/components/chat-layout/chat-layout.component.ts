import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { UsuarioService } from '../../../../features/users/services/usuario.service';
import { ChatProvider } from '../../../../shared/models/chat';
import { ChatLayoutService } from '../../../../shared/services/chat-layout.service';
import { ProviderMapperService } from '../../../../shared/services/provider-mapper.service';
import { FloatingTabComponent } from '../../../../shared/ui/components/floating-tab/floating-tab.component';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { FloatingChatModalComponent } from '../floating-chat-modal/floating-chat-modal.component';

@Component({
  selector: 'app-chat-layout',
  imports: [
    CommonModule,
    ChatSidebarComponent,
    FloatingChatModalComponent,
    FloatingTabComponent
  ],
  templateUrl: './chat-layout.component.html',
  styleUrl: './chat-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private chatLayoutService = inject(ChatLayoutService);
  private providerMapperService = inject(ProviderMapperService);
  private usuarioService = inject(UsuarioService);

  @Input() enableSidebar: boolean = true;
  @Input() autoLoadProviders: boolean = true;
  @Input() sidebarDefaultVisible: boolean = false;

  // State observables
  layoutState$ = this.chatLayoutService.state$;

  // Mobile detection
  get isMobileView(): boolean {
    return window.innerWidth < 768;
  }

  ngOnInit(): void {
    this.initializeLayout();
    setTimeout(() => this.debugTabVisibility(), 1000);

    if (this.autoLoadProviders) {
      this.loadProviders();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeLayout(): void {
    console.log('ChatLayout: Inicializando layout', {
      sidebarDefaultVisible: this.sidebarDefaultVisible,
      enableSidebar: this.enableSidebar,
    });

    // Solo aplicar valores iniciales si son diferentes al estado actual (idempotencia)
    const current = this.chatLayoutService.currentState;
    if (this.enableSidebar) {
      if (this.sidebarDefaultVisible !== current.sidebarVisible) {
        this.sidebarDefaultVisible ? this.chatLayoutService.showSidebar() : this.chatLayoutService.hideSidebar();
      }
    }

    // Subscribirse a cambios de estado si es necesario
    this.layoutState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      console.log('ChatLayout: Estado actualizado', state);
      // Lógica adicional de coordinación si es necesaria
      this.handleLayoutStateChange(state);
    });
  }

  private handleLayoutStateChange(state: any): void {
    console.log('ChatLayout: Manejo de cambio de estado', state);
  }

  private async loadProviders(): Promise<void> {
    console.log('ChatLayout: Iniciando carga de proveedores');
    try {
      this.chatLayoutService.setLoading(true);
      this.chatLayoutService.setError(null); // Limpiar errores previos

      // Obtener proveedores del servicio
      const usuarios = await this.usuarioService.obtenerProveedores().toPromise();
      console.log('ChatLayout: Proveedores obtenidos', usuarios?.length || 0);

      if (usuarios && usuarios.length > 0) {
        // Mapear usuarios a ChatProvider
        const providers: ChatProvider[] = usuarios.map((usuario: any) =>
          this.providerMapperService.mapUsuarioToChatProvider(usuario)
        );

        console.log('ChatLayout: Proveedores mapeados', providers.length);
        // Actualizar el estado del layout con los providers
        this.chatLayoutService.setProviders(providers);
      } else {
        console.warn('ChatLayout: No se encontraron proveedores');
        this.chatLayoutService.setError('No se encontraron proveedores disponibles.');
      }
    } catch (error) {
      console.error('ChatLayout: Error loading providers:', error);
      this.chatLayoutService.setError('Error al cargar proveedores. Intenta nuevamente.');
    } finally {
      this.chatLayoutService.setLoading(false);
      console.log('ChatLayout: Carga de proveedores finalizada');
    }
  }

  // Métodos públicos para control desde componentes padre
  public toggleSidebar(): void {
    this.chatLayoutService.toggleSidebar();
  }

  public showSidebar(): void {
    console.log('ChatLayout: Mostrando sidebar');
    this.chatLayoutService.showSidebar();
  }

  public hideSidebar(): void {
    console.log('ChatLayout: Ocultando sidebar');
    this.chatLayoutService.hideSidebar();
  }

  public showModal(): void {
    console.log('ChatLayout: Mostrando modal');
    this.chatLayoutService.showModal();
  }

  public refreshProviders(): void {
    console.log('ChatLayout: Recargando proveedores manualmente');
    this.loadProviders();
  }

  public setProviders(providers: ChatProvider[]): void {
    this.chatLayoutService.setProviders(providers);
  }

  public filterProviders(searchTerm: string): void {
    // Implementar filtrado básico
    const currentState = this.chatLayoutService.currentState;
    const filtered = currentState.allProviders.filter(provider =>
      provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.contactName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.chatLayoutService.filterProviders(searchTerm);
  }

  // Getters para acceso desde template
  get isSidebarEnabled(): boolean {
    return this.enableSidebar;
  }

  get currentState() {
    return this.chatLayoutService.currentState;
  }

  public debugTabVisibility(): void {
  const state = this.chatLayoutService.currentState;
  console.log('Modal Tab Visibility Debug:', {
    modalVisible: state.modalVisible,
    currentState: state
  });
}
}
