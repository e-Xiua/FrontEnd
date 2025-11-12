import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteGeneratorFullComponent } from './route-generator-full.component';

describe('RouteGeneratorFullComponent', () => {
  let component: RouteGeneratorFullComponent;
  let fixture: ComponentFixture<RouteGeneratorFullComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteGeneratorFullComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RouteGeneratorFullComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
