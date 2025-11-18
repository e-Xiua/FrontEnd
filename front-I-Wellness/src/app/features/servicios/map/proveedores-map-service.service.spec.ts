import { TestBed } from '@angular/core/testing';

import { ProveedorMapService } from './proveedores-map.service';

describe('ProveedoresMapService', () => {
  let service: ProveedorMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProveedorMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
