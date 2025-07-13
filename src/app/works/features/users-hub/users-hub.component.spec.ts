import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersHubComponent } from './users-hub.component';

describe('UsersHubComponent', () => {
  let component: UsersHubComponent;
  let fixture: ComponentFixture<UsersHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersHubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
