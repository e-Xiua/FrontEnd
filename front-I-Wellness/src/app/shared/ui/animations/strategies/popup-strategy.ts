import { ProviderDisplayStrategy } from "../model/display-strategy";

export class PopupStrategy implements ProviderDisplayStrategy {
  show(component: any, providerData: any): void {
    // Example: Show provider data in a modal or popup
    component.ngZone.run(() => {
      component.showProviderPopup = true; // Assume a different property for popup
      component.placeData = { /* Map providerData */ };
      // Similar service fetching logic
      component.cdr.markForCheck();
    });
  }

  hide(component: any): void {
    component.ngZone.run(() => {
      component.showProviderPopup = false;
      component.selectedProviderId = null;
      component.cdr.markForCheck();
    });
  }
}
