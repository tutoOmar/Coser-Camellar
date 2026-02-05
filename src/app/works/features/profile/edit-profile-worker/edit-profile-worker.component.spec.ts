import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProfileWorkerComponent } from './edit-profile-worker.component';

describe('EditProfileWorkerComponent', () => {
  let component: EditProfileWorkerComponent;
  let fixture: ComponentFixture<EditProfileWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileWorkerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
