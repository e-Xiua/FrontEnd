import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaEmpresasComponent } from './mapa-empresas.component';

describe('MapaEmpresasComponent', () => {
  let component: MapaEmpresasComponent;
  let fixture: ComponentFixture<MapaEmpresasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaEmpresasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapaEmpresasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
