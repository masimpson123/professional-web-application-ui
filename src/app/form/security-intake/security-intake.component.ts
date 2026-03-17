import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-security-intake',
  imports: [ReactiveFormsModule],
  templateUrl: './security-intake.component.html',
  styleUrl: './security-intake.component.css'
})
export class SecurityIntakeComponent {
  @Input() securityFormGroup!: FormGroup;
  @Output() securityFormGroupChange = new EventEmitter<FormGroup>();

  ngOnInit() {
    this.securityFormGroup.valueChanges.subscribe(() => {
      this.securityFormGroupChange.emit(this.securityFormGroup);
    });
  }
}
