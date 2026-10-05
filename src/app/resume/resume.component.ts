import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RESUME_URL } from '../demos';

@Component({
  selector: 'app-resume',
  imports: [],
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.css',
  standalone: true
})
export class ResumeComponent {
  constructor(private router: Router) {
    window.open(RESUME_URL, '_blank');
    this.router.navigate(['root']);
  }
}
