import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProfilePageComponent } from '../../proveedor/profile-page/profile-page.component';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [ProfilePageComponent, CommonModule],
  templateUrl: './provider-profile.component.html',
  styleUrl: './provider-profile.component.css'
})
export class ProviderProfileComponent implements OnInit, OnDestroy {
  providerId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('🚀 ProviderProfileComponent initialized');
    
    // Obtener el ID inicial de forma síncrona primero
    const initialId = this.route.snapshot.paramMap.get('id');
    if (initialId) {
      this.providerId = Number(initialId);
      console.log('🔍 ID inicial del proveedor (snapshot):', this.providerId);
    }

    // Luego suscribirse a cambios en los parámetros de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          const newProviderId = Number(id);
          if (this.providerId !== newProviderId) {
            this.providerId = newProviderId;
            console.log('� Cambio de ID del proveedor:', this.providerId);
          }
        } else {
          console.error('❌ No se proporcionó ID de proveedor en la ruta');
          this.providerId = null;
        }
      });
  }

  ngOnDestroy(): void {
    console.log('🧹 ProviderProfileComponent destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
