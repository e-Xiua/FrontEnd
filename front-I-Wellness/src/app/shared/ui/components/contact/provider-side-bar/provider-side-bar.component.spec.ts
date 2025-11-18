import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderSideBarComponent } from './provider-side-bar.component';

describe('ProviderSideBarComponent', () => {
  let component: ProviderSideBarComponent;
  let fixture: ComponentFixture<ProviderSideBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderSideBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProviderSideBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
