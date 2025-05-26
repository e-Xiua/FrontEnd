import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoServicioComponent } from './info-servicio.component';

describe('InfoServicioComponent', () => {
  let component: InfoServicioComponent;
  let fixture: ComponentFixture<InfoServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoServicioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
