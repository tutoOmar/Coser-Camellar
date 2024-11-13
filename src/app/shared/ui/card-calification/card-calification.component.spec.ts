import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCalificationComponent } from './card-calification.component';

describe('CardCalificationComponent', () => {
  let component: CardCalificationComponent;
  let fixture: ComponentFixture<CardCalificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardCalificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardCalificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
