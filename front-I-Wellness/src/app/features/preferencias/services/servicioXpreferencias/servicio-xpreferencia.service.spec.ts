import { TestBed } from '@angular/core/testing';

import { ServicioXPreferenciaService } from './servicio-xpreferencia.service';

describe('ServicioXPreferenciaService', () => {
  let service: ServicioXPreferenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioXPreferenciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
