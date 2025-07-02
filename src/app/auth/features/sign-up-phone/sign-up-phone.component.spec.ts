import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignUpPhoneComponent } from './sign-up-phone.component';

describe('SignUpPhoneComponent', () => {
  let component: SignUpPhoneComponent;
  let fixture: ComponentFixture<SignUpPhoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpPhoneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignUpPhoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
