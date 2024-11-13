import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatinadoresComponent } from './patinadores.component';

describe('PatinadoresComponent', () => {
  let component: PatinadoresComponent;
  let fixture: ComponentFixture<PatinadoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatinadoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatinadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
