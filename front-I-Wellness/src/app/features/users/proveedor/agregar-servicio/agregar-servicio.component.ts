import { Component } from '@angular/core';
import { ProviderServiceFormContainerComponent } from '../../../../shared/ui/components/provider-service-form/provider-service-form.container';

@Component({
  selector: 'app-agregar-servicio',
  standalone: true,
  imports: [ProviderServiceFormContainerComponent],
  template: `<app-provider-service-form-container></app-provider-service-form-container>`
})
export class AgregarServicioComponent {
}
