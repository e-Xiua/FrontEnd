import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearTuristaComponent } from './crear-turista.component';

describe('CrearTuristaComponent', () => {
  let component: CrearTuristaComponent;
  let fixture: ComponentFixture<CrearTuristaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearTuristaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearTuristaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
