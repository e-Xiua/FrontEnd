import { animate, state, style, transition, trigger } from '@angular/animations';

export const slideInAnimation = trigger('slideIn', [
  state('hidden', style({ transform: 'translateX(100%)', opacity: 0 })),
  state('visible', style({ transform: 'translateX(0)', opacity: 1 })),
  transition('hidden => visible', animate('300ms ease-out')),
  transition('visible => hidden', animate('300ms ease-in'))
]);
