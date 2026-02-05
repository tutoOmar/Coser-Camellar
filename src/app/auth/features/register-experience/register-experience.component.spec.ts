import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterExperienceComponent } from './register-experience.component';

describe('RegisterExperienceComponent', () => {
  let component: RegisterExperienceComponent;
  let fixture: ComponentFixture<RegisterExperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterExperienceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
