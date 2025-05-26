import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderProveedorComponent } from './header-proveedor.component';

describe('HeaderProveedorComponent', () => {
  let component: HeaderProveedorComponent;
  let fixture: ComponentFixture<HeaderProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
