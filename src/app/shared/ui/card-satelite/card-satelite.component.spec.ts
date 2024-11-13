import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardSateliteComponent } from './card-satelite.component';

describe('CardSateliteComponent', () => {
  let component: CardSateliteComponent;
  let fixture: ComponentFixture<CardSateliteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSateliteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardSateliteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
