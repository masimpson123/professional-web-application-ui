import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityIntakeComponent } from './security-intake.component';

describe('SecurityIntakeComponent', () => {
  let component: SecurityIntakeComponent;
  let fixture: ComponentFixture<SecurityIntakeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityIntakeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityIntakeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
