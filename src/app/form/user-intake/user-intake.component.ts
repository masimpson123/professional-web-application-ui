import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-intake',
  imports: [ReactiveFormsModule],
  templateUrl: './user-intake.component.html',
  styleUrl: './user-intake.component.css'
})
export class UserIntakeComponent {
  @Input() securityFormGroup!: FormGroup;
  @Output() securityFormGroupChange = new EventEmitter<FormGroup>();

  ngOnInit() {
    this.securityFormGroup.valueChanges.subscribe(() => {
      this.securityFormGroupChange.emit(this.securityFormGroup);
    });
  }
  get userName() {
    return this.securityFormGroup.get('userIntake.usersName');
  }
}
