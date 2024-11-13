import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SateliteIndividualComponent } from './satelite-individual.component';

describe('SateliteIndividualComponent', () => {
  let component: SateliteIndividualComponent;
  let fixture: ComponentFixture<SateliteIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SateliteIndividualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SateliteIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
