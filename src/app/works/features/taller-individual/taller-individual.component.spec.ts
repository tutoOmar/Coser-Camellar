import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TallerIndividualComponent } from './taller-individual.component';

describe('TallerIndividualComponent', () => {
  let component: TallerIndividualComponent;
  let fixture: ComponentFixture<TallerIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TallerIndividualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TallerIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
