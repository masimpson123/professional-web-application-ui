import { Component, signal} from '@angular/core';
import { form, Field } from '@angular/forms/signals';

@Component({
  selector: 'app-signal-form',
  imports: [Field],
  templateUrl: './signal-form.component.html',
  styleUrl: './signal-form.component.css',
})
export class SignalFormComponent {
  loginModel = signal<LoginData>({
    email: '',
    password: '',
  });
  loginForm = form(this.loginModel);
  randomlyGeneratePassword(){
    this.loginForm.password().value.set(crypto.randomUUID());
  }
}

interface LoginData {
  email: string;
  password: string;
}