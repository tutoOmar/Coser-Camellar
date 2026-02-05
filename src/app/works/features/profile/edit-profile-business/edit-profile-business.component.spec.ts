import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProfileBusinessComponent } from './edit-profile-business.component';

describe('EditProfileBusinessComponent', () => {
  let component: EditProfileBusinessComponent;
  let fixture: ComponentFixture<EditProfileBusinessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileBusinessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileBusinessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
