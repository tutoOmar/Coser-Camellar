import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProfileEmpresaOrNaturalPersonComponent } from './edit-profile-empresa-or-natural-person.component';

describe('EditProfileEmpresaOrNaturalPersonComponent', () => {
  let component: EditProfileEmpresaOrNaturalPersonComponent;
  let fixture: ComponentFixture<EditProfileEmpresaOrNaturalPersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileEmpresaOrNaturalPersonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileEmpresaOrNaturalPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
