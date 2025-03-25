import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeTuristaComponent } from './home-turista.component';

describe('HomeTuristaComponent', () => {
  let component: HomeTuristaComponent;
  let fixture: ComponentFixture<HomeTuristaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTuristaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeTuristaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
