import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-make-networking-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './make-networking-contact.component.html',
  styleUrl: './make-networking-contact.component.css'
})
export class MakeNetworkingContactComponent {
  @Output() connect = new EventEmitter<void>();

  onConnect(): void {
    this.connect.emit();
  }
}
