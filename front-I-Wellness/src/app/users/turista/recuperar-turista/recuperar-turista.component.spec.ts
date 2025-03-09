import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecuperarTuristaComponent } from './recuperar-turista.component';

describe('RecuperarTuristaComponent', () => {
  let component: RecuperarTuristaComponent;
  let fixture: ComponentFixture<RecuperarTuristaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarTuristaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecuperarTuristaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
