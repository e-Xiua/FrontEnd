export interface ProviderDisplayStrategy {
  show(component: any, providerData: any): void;
  hide(component: any): void;
}
