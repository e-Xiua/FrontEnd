import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneradorDeRutasProveedorComponent } from './generador-de-rutas-proveedor.component';

describe('GeneradorDeRutasProveedorComponent', () => {
  let component: GeneradorDeRutasProveedorComponent;
  let fixture: ComponentFixture<GeneradorDeRutasProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneradorDeRutasProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneradorDeRutasProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
