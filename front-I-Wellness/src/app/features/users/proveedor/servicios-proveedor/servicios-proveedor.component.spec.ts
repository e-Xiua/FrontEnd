import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosProveedorComponent } from './servicios-proveedor.component';

describe('ServiciosProveedorComponent', () => {
  let component: ServiciosProveedorComponent;
  let fixture: ComponentFixture<ServiciosProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiciosProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
