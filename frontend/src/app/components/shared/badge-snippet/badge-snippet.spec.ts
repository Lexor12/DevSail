import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeSnippet } from './badge-snippet';

describe('BadgeSnippet', () => {
  let component: BadgeSnippet;
  let fixture: ComponentFixture<BadgeSnippet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeSnippet],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeSnippet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
