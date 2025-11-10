import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ChatProvider } from '../../../../models/chat';

@Component({
  selector: 'app-contact-menu',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './contact-menu.component.html',
  styleUrl: './contact-menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ContactMenuComponent implements AfterViewInit {
  @Input({ required: true }) provider!: ChatProvider;
  @Input() isVisible: boolean = false;
  @Input() compactMode: boolean = false;

  @Output() whatsappClick = new EventEmitter<ChatProvider>();
  @Output() telegramClick = new EventEmitter<ChatProvider>();
  @Output() emailClick = new EventEmitter<ChatProvider>();

  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  ngAfterViewInit(): void {
    if (this.menuTrigger) {
      this.menuTrigger.menuOpened.subscribe(() => {
        setTimeout(() => {
          const overlay = document.querySelector('.cdk-overlay-pane');
          if (overlay) {
            (overlay as HTMLElement).style.zIndex = '9999';
          }
        }, 0);
      });
    }
  }

  onWhatsAppClick(): void {
    this.whatsappClick.emit(this.provider);
  }

  onTelegramClick(): void {
    this.telegramClick.emit(this.provider);
  }

  onEmailClick(): void {
    this.emailClick.emit(this.provider);
  }

  openWhatsApp(provider: ChatProvider): void {
    const phoneNumber = provider.telefono || '573132629210';
    const message = `Hola ${provider.contactName}, me interesa conocer más sobre tus servicios de turismo.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  openTelegram(provider: ChatProvider): void {
    const phoneNumber = provider.telefono || '573132629210';
    const message = `Hola ${provider.contactName}, me interesa conocer más sobre tus servicios de turismo.`;
    const telegramUrl = `https://t.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  }

  openEmail(provider: ChatProvider): void {
    const email = provider.email || 'contacto@ejemplo.com';
    const subject = `Consulta sobre servicios de turismo - ${provider.contactName}`;
    const body = `Hola ${provider.contactName},\n\nMe interesa conocer más sobre tus servicios de turismo.\n\nSaludos cordiales.`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  }
}
