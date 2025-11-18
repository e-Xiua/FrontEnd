import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LayoutAdapterComponent } from '../../../../shared/components/layout-adapter/layout-adapter.component';
import { UniversalHeaderComponent } from '../../../../shared/components/universal-header/universal-header.component';
import { ChatIntegrationService } from '../../../../shared/services/chat-integration.service';
import { ChatLayoutService } from '../../../../shared/services/chat-layout.service';
import { LayoutAdapterService } from '../../../../shared/services/layout-adapter.service';
import { FloatingTabComponent } from '../../../../shared/ui/components/floating-tab/floating-tab.component';
import { TuristaChatDemoComponent } from './turista-chat-demo.component';

@Component({
  selector: 'app-turista-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    UniversalHeaderComponent,
    LayoutAdapterComponent,
    TuristaChatDemoComponent,
    FloatingTabComponent,
  ],
  template: `
    <div class="turista-layout-container">
      <app-universal-header
        role="turista"
        [ngStyle]="headerStyles"
        class="layout-header"
      ></app-universal-header>

      <div class="layout-body" [ngStyle]="bodyStyles">
        <app-turista-chat-demo
          [isModalVisible]="modalVisible"
        ></app-turista-chat-demo>

        <app-floating-tab
          label="Abrir Chat"
          iconClass="fas fa-comments"
          position="right"
          orientation="vertical"
          [controls]="'modal'"
        ></app-floating-tab>

        <app-layout-adapter
          [adaptForSidebar]="false"
          [adaptForHeader]="true"
          [adaptForModal]="true"
          class="layout-content"
        >
          <main class="main-content">
            <router-outlet></router-outlet>
          </main>
        </app-layout-adapter>
      </div>
    </div>
  `,
  styles: [
    `
      .turista-layout-container {
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
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class TuristaLayoutComponent implements OnInit, OnDestroy {
  modalVisible = false;
  headerStyles: any = {};
  bodyStyles: any = { marginTop: '64px' };
  private destroy$ = new Subject<void>();

  constructor(
    private chatLayoutService: ChatLayoutService,
    private chatIntegrationService: ChatIntegrationService,
    private layoutAdapter: LayoutAdapterService
  ) {}

  ngOnInit(): void {
    this.chatIntegrationService.checkRoleAndRedirect('Turista');

    this.layoutAdapter.headerStyle$
      .pipe(takeUntil(this.destroy$))
      .subscribe((styles) => {
        this.headerStyles = styles;
      });

    if (this.chatIntegrationService.initializeChatForTurista()) {
      this.chatLayoutService.state$
        .pipe(takeUntil(this.destroy$))
        .subscribe((state) => {
          this.modalVisible = state.modalVisible;
          this.layoutAdapter.updateModalState(state.modalVisible);
        });
    } else {
      this.chatIntegrationService.handleNavigationError(
        new Error('Chat initialization failed for turista')
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatIntegrationService.disableChat();
    this.layoutAdapter.reset();
  }
}
