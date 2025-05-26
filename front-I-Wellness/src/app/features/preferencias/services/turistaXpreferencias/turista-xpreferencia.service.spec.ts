import { TestBed } from '@angular/core/testing';

import { TuristaXPreferenciaService } from './turista-xpreferencia.service';

describe('TuristaXPreferenciaService', () => {
  let service: TuristaXPreferenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TuristaXPreferenciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
