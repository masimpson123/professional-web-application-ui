import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoHeaderComponent } from '../demo-header/demo-header.component';
import { GUIDANCE_HOME } from './paths';

/** The demo's page in the portfolio. The app itself opens full screen from here. */
@Component({
  selector: 'app-guidance-intro',
  imports: [DemoHeaderComponent, RouterLink],
  templateUrl: './guidance-intro.component.html',
  styleUrl: './guidance-intro.component.css',
})
export class GuidanceIntroComponent {
  readonly appUrl = GUIDANCE_HOME;
}
