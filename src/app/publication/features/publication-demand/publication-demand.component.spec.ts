import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationDemandComponent } from './publication-demand.component';

describe('PublicationDemandComponent', () => {
  let component: PublicationDemandComponent;
  let fixture: ComponentFixture<PublicationDemandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationDemandComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationDemandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
