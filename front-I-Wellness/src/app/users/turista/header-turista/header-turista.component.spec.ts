import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderTuristaComponent } from './header-turista.component';

describe('HeaderTuristaComponent', () => {
  let component: HeaderTuristaComponent;
  let fixture: ComponentFixture<HeaderTuristaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderTuristaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderTuristaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
