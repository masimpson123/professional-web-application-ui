import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
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
  securityForm = new FormGroup({
    userIntake: new FormGroup({
      usersName: new FormControl('Mike'),
      usersPetsName: new FormControl('Speck')
    }),
    securityIntake: new FormGroup({
      securityTerm: new FormControl(':)'),
      securityToken: new FormControl('jwt-1234')
    })
  });
onSubmit() {
    console.log(this.securityForm.value);
  }
}
