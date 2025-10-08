import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutePoisShowComponent } from './route-pois-show.component';

describe('RoutePoisShowComponent', () => {
  let component: RoutePoisShowComponent;
  let fixture: ComponentFixture<RoutePoisShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutePoisShowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutePoisShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
