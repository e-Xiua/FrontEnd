import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapPoiComponent } from './map-poi.component';

describe('MapPoiComponent', () => {
  let component: MapPoiComponent;
  let fixture: ComponentFixture<MapPoiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapPoiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapPoiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
