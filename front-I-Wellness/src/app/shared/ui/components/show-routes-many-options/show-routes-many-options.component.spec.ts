import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowRoutesManyOptionsComponent } from './show-routes-many-options.component';

describe('ShowRoutesManyOptionsComponent', () => {
  let component: ShowRoutesManyOptionsComponent;
  let fixture: ComponentFixture<ShowRoutesManyOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowRoutesManyOptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowRoutesManyOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
