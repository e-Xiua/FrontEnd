import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginProveedorComponent } from './login-proveedor.component';

describe('LoginProveedorComponent', () => {
  let component: LoginProveedorComponent;
  let fixture: ComponentFixture<LoginProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
