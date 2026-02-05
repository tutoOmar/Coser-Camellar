import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterAiComponent } from './register-ai.component';

describe('RegisterAiComponent', () => {
  let component: RegisterAiComponent;
  let fixture: ComponentFixture<RegisterAiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterAiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterAiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
