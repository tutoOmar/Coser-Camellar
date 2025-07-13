import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpresaIndividualComponent } from './empresa-individual.component';

describe('EmpresaIndividualComponent', () => {
  let component: EmpresaIndividualComponent;
  let fixture: ComponentFixture<EmpresaIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpresaIndividualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpresaIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
