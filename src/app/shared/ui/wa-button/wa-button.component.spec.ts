import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaButtonComponent } from './wa-button.component';

describe('WaButtonComponent', () => {
  let component: WaButtonComponent;
  let fixture: ComponentFixture<WaButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
