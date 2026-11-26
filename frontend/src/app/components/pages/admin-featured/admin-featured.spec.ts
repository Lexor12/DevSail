import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFeatured } from './admin-featured';

describe('AdminFeatured', () => {
  let component: AdminFeatured;
  let fixture: ComponentFixture<AdminFeatured>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFeatured],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminFeatured);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
