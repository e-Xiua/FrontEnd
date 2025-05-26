import { TestBed } from '@angular/core/testing';
import { PreferenciasService } from './preferencias.service';



describe('PreferenciasService', () => {
  let service: PreferenciasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreferenciasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
