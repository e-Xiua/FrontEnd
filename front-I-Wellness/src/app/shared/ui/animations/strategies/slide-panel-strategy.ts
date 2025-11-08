import { ProviderDisplayStrategy } from "../model/display-strategy";

export class SlidePanelStrategy implements ProviderDisplayStrategy {
  show(component: any, item: any): void {
    component.ngZone.run(() => {
      // Item is expected to be a MapDisplayItem; delegate the handoff to the component method
      component.selectedProviderId = item?.id ?? null;
      // Use the component's own updater to set visibility and normalized PlaceData from item.originalData
      if (typeof component.updateProviderCardVisibility === 'function') {
        component.updateProviderCardVisibility(true, item);
      } else {
        // Fallback: keep previous behavior, but only toggle visibility
        component.showProviderCardVisible = true;
      }
      component.cdr?.markForCheck?.();
    });
  }

  hide(component: any): void {
    component.ngZone.run(() => {
      component.showProviderCardVisible = false;
      component.selectedProviderId = null;
      component.cdr.markForCheck(); // If using OnPush
    });
  }
}
