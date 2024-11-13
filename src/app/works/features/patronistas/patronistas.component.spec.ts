import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatronistasComponent } from './patronistas.component';

describe('PatronistasComponent', () => {
  let component: PatronistasComponent;
  let fixture: ComponentFixture<PatronistasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatronistasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatronistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
