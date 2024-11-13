import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CortadoresComponent } from './cortadores.component';

describe('CortadoresComponent', () => {
  let component: CortadoresComponent;
  let fixture: ComponentFixture<CortadoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CortadoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CortadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
