import { Component } from '@angular/core';
import {FormGroup, FormControl, ReactiveFormsModule} from '@angular/forms';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, AsyncPipe, JsonPipe],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
  standalone: true
})
export class FormComponent {
  securityForm = new FormGroup({
    securityTerm: new FormControl(':)'),
    securityToken: new FormControl('jwt-1234'),
  });
onSubmit() {
    console.log(this.securityForm.value);
  }
}
