import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroTuristaComponent } from './registro-turista.component';

describe('RegistroTuristaComponent', () => {
  let component: RegistroTuristaComponent;
  let fixture: ComponentFixture<RegistroTuristaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroTuristaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroTuristaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
