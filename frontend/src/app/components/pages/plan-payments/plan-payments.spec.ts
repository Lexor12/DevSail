import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanPayments } from './plan-payments';

describe('PlanPayments', () => {
  let component: PlanPayments;
  let fixture: ComponentFixture<PlanPayments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanPayments],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanPayments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
