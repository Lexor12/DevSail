import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteProjectModal } from './delete-project-modal';

describe('DeleteProjectModal', () => {
  let component: DeleteProjectModal;
  let fixture: ComponentFixture<DeleteProjectModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteProjectModal],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteProjectModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
