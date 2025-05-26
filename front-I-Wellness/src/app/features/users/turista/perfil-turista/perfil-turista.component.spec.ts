import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilTuristaComponent } from './perfil-turista.component';

describe('PerfilTuristaComponent', () => {
  let component: PerfilTuristaComponent;
  let fixture: ComponentFixture<PerfilTuristaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilTuristaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilTuristaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
