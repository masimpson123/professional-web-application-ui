import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, AbstractControl, ValidatorFn, ValidationErrors, Validators } from '@angular/forms';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { UserIntakeComponent } from './user-intake/user-intake.component';
import { SecurityIntakeComponent } from './security-intake/security-intake.component';
import { SignalFormComponent } from "./signal-form/signal-form.component";

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, ConfirmationComponent, WelcomeComponent, UserIntakeComponent, SecurityIntakeComponent, SignalFormComponent],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
  standalone: true
})
export class FormComponent {
  currentStep = 1;
  securityForm = new FormGroup({
    userIntake: new FormGroup({
      usersName: new FormControl('', [Validators.required, forbiddenCharacterSequenceValidator(new RegExp('q'))]),
      usersPetsName: new FormControl('')
    }),
    securityIntake: new FormGroup({
      securityTerm: new FormControl('', Validators.required),
      securityToken: new FormControl('')
    })
  });
  next() {
    if ( this.currentStep === 4 ) return;
    this.currentStep++;
  }
  previous() {
    if ( this.currentStep === 1 ) return;
    this.currentStep--;
  }
  submit() {
    alert(JSON.stringify(this.securityForm.value));
  }
}

export const forbiddenCharacterSequenceValidator =
  (nameRe: RegExp): ValidatorFn =>
    (control: AbstractControl): ValidationErrors | null =>
      nameRe.test(control.value) ? {forbiddenCharacterSequence: {value: control.value}} : null;
