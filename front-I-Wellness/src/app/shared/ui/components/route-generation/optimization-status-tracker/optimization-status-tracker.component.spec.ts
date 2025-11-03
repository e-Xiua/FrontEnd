import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptimizationStatusTrackerComponent } from './optimization-status-tracker.component';

describe('OptimizationStatusTrackerComponent', () => {
  let component: OptimizationStatusTrackerComponent;
  let fixture: ComponentFixture<OptimizationStatusTrackerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptimizationStatusTrackerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptimizationStatusTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
