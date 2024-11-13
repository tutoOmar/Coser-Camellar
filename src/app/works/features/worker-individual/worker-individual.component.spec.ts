import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerIndividualComponent } from './worker-individual.component';

describe('WorkerIndividualComponent', () => {
  let component: WorkerIndividualComponent;
  let fixture: ComponentFixture<WorkerIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerIndividualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
