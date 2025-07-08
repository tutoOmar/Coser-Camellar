import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnPublicationsComponent } from './own-publications.component';

describe('OwnPublicationsComponent', () => {
  let component: OwnPublicationsComponent;
  let fixture: ComponentFixture<OwnPublicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnPublicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnPublicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
