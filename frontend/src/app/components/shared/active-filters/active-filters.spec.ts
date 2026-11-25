import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveFilters } from './active-filters';

describe('ActiveFilters', () => {
  let component: ActiveFilters;
  let fixture: ComponentFixture<ActiveFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveFilters],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveFilters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
