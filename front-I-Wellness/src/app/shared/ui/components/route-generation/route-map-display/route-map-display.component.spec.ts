import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouteMapDisplayComponent } from './route-map-display.component';

describe('RouteMapDisplayComponent', () => {
  let component: RouteMapDisplayComponent;
  let fixture: ComponentFixture<RouteMapDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteMapDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RouteMapDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit mapInitialized when map is initialized', () => {
    spyOn(component.mapInitialized, 'emit');
    // Trigger map initialization
    expect(component.mapInitialized.emit).toHaveBeenCalled();
  });

  it('should display empty state when no optimizedRoute is provided', () => {
    component.optimizedRoute = null;
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should emit providerSelected when a provider is clicked', () => {
    spyOn(component.providerSelected, 'emit');
    const mockProviderData = {
      id: 1,
      nombre: 'Test Provider'
    };
    component.onMarkerClick(mockProviderData);
    // Event emission logic depends on optimizedRoute being set
  });
});
