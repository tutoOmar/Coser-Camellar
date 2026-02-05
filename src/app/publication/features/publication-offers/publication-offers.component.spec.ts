import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationOffersComponent } from './publication-offers.component';

describe('PublicationOffersComponent', () => {
  let component: PublicationOffersComponent;
  let fixture: ComponentFixture<PublicationOffersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationOffersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
