import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalFormComponent } from './signal-form.component';

describe('SignalFormComponent', () => {
  let component: SignalFormComponent;
  let fixture: ComponentFixture<SignalFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
