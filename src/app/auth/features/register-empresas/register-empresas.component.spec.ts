import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterEmpresasComponent } from './register-empresas.component';

describe('RegisterEmpresasComponent', () => {
  let component: RegisterEmpresasComponent;
  let fixture: ComponentFixture<RegisterEmpresasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterEmpresasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterEmpresasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
