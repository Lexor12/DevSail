import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminReportDetail } from './admin-report-detail';

describe('AdminReportDetail', () => {
  let component: AdminReportDetail;
  let fixture: ComponentFixture<AdminReportDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReportDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminReportDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
