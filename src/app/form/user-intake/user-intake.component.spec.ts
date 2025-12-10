import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserIntakeComponent } from './user-intake.component';

describe('UserIntakeComponent', () => {
  let component: UserIntakeComponent;
  let fixture: ComponentFixture<UserIntakeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserIntakeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserIntakeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
