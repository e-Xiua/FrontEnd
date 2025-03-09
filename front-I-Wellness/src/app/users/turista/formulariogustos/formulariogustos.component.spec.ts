import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulariogustosComponent } from './formulariogustos.component';

describe('FormulariogustosComponent', () => {
  let component: FormulariogustosComponent;
  let fixture: ComponentFixture<FormulariogustosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulariogustosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormulariogustosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
