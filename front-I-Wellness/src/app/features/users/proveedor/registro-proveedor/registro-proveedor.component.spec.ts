import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroProveedorComponent } from './registro-proveedor.component';

describe('RegistroProveedorComponent', () => {
  let component: RegistroProveedorComponent;
  let fixture: ComponentFixture<RegistroProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
