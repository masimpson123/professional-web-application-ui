import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, AbstractControl, ValidatorFn, ValidationErrors, Validators } from '@angular/forms';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { UserIntakeComponent } from './user-intake/user-intake.component';
import { SecurityIntakeComponent } from './security-intake/security-intake.component';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, AsyncPipe, JsonPipe, ConfirmationComponent, WelcomeComponent, UserIntakeComponent, SecurityIntakeComponent],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
  standalone: true
})
export class FormComponent {
  currentStep = 1;
  securityForm = new FormGroup({
    userIntake: new FormGroup({
      usersName: new FormControl('Mike', [Validators.required, forbiddenCharacterSequenceValidator(new RegExp('q'))]),
      usersPetsName: new FormControl('Speck')
    }),
    securityIntake: new FormGroup({
      securityTerm: new FormControl(':)', Validators.required),
      securityToken: new FormControl('jwt-1234')
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

export function forbiddenCharacterSequenceValidator(nameRe: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = nameRe.test(control.value);
    return forbidden ? {forbiddenCharacterSequence: {value: control.value}} : null;
  };
}
