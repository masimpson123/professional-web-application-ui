import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resume',
  imports: [],
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.css'
})
export class ResumeComponent {
  constructor(private router: Router) {
    window.open('./assets/simpsonResume2025.pdf', '_blank');
    this.router.navigate(['root']);
  }
}
