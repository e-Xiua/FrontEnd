import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoiRouteBuilderComponent } from './poi-route-builder.component';

describe('PoiRouteBuilderComponent', () => {
  let component: PoiRouteBuilderComponent;
  let fixture: ComponentFixture<PoiRouteBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoiRouteBuilderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoiRouteBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
