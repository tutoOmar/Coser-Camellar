import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SatelitesComponent } from './satelites.component';

describe('SatelitesComponent', () => {
  let component: SatelitesComponent;
  let fixture: ComponentFixture<SatelitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SatelitesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SatelitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
