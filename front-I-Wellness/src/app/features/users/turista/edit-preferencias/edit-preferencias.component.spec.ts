import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPreferenciasComponent } from './edit-preferencias.component';

describe('EditPreferenciasComponent', () => {
  let component: EditPreferenciasComponent;
  let fixture: ComponentFixture<EditPreferenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPreferenciasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPreferenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
