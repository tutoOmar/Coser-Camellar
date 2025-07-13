import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonaNaturalIndividualComponent } from './persona-natural-individual.component';

describe('PersonaNaturalIndividualComponent', () => {
  let component: PersonaNaturalIndividualComponent;
  let fixture: ComponentFixture<PersonaNaturalIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaNaturalIndividualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonaNaturalIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
