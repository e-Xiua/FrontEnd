import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecuperarProveedorComponent } from './recuperar-proveedor.component';

describe('RecuperarProveedorComponent', () => {
  let component: RecuperarProveedorComponent;
  let fixture: ComponentFixture<RecuperarProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecuperarProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
