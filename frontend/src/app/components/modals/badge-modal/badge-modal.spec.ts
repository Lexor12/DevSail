import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeModal } from './badge-modal';

describe('BadgeModal', () => {
  let component: BadgeModal;
  let fixture: ComponentFixture<BadgeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeModal],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
