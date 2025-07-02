import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicactionModalRegisterComponent } from './publicaction-modal-register.component';

describe('PublicactionModalRegisterComponent', () => {
  let component: PublicactionModalRegisterComponent;
  let fixture: ComponentFixture<PublicactionModalRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicactionModalRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicactionModalRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
