import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CosturerosComponent } from './costureros.component';

describe('CosturerosComponent', () => {
  let component: CosturerosComponent;
  let fixture: ComponentFixture<CosturerosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CosturerosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CosturerosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
