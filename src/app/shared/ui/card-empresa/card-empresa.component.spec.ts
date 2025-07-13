import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEmpresaComponent } from './card-empresa.component';

describe('CardEmpresaComponent', () => {
  let component: CardEmpresaComponent;
  let fixture: ComponentFixture<CardEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
