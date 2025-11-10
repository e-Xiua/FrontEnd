import { Component } from '@angular/core';
import { ProfilePageComponent } from '../profile-page/profile-page.component';

@Component({
  selector: 'app-home-proveedor',
  standalone: true,
  imports: [ProfilePageComponent],
  template: `
    <app-profile-page
      [showServiceManager]="true"
      [showNetworkingCard]="true"
      [showRouteGeneration]="true"
    ></app-profile-page>
  `
})
export class HomeProveedorComponent {}




