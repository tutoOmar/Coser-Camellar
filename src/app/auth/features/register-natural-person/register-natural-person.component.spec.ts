import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterNaturalPersonComponent } from './register-natural-person.component';

describe('RegisterNaturalPersonComponent', () => {
  let component: RegisterNaturalPersonComponent;
  let fixture: ComponentFixture<RegisterNaturalPersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterNaturalPersonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterNaturalPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
