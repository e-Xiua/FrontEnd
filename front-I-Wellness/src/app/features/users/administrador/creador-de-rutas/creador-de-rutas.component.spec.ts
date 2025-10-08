import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreadorDeRutasComponent } from './creador-de-rutas.component';

describe('CreadorDeRutasComponent', () => {
  let component: CreadorDeRutasComponent;
  let fixture: ComponentFixture<CreadorDeRutasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreadorDeRutasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreadorDeRutasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
