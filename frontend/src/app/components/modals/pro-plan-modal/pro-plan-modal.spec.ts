import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProPlanModal } from './pro-plan-modal';

describe('ProPlanModal', () => {
  let component: ProPlanModal;
  let fixture: ComponentFixture<ProPlanModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProPlanModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ProPlanModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
