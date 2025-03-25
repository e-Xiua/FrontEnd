import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTuristaComponent } from './login-turista.component';

describe('LoginTuristaComponent', () => {
  let component: LoginTuristaComponent;
  let fixture: ComponentFixture<LoginTuristaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginTuristaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginTuristaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
