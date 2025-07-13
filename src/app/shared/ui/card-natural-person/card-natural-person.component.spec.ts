import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardNaturalPersonComponent } from './card-natural-person.component';

describe('CardNaturalPersonComponent', () => {
  let component: CardNaturalPersonComponent;
  let fixture: ComponentFixture<CardNaturalPersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardNaturalPersonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardNaturalPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
