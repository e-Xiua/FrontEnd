import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapForAllProvidersComponent } from './map-for-all-providers.component';

describe('MapForAllProvidersComponent', () => {
  let component: MapForAllProvidersComponent;
  let fixture: ComponentFixture<MapForAllProvidersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapForAllProvidersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapForAllProvidersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
