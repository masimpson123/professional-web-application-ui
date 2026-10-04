import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { DEMO_GROUPS, DEMOS, RESUME_URL } from './demos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  host: { '[class.full-screen]': 'fullScreen()' },
})
export class AppComponent {
  private readonly router = inject(Router);
  menuOpen = false;
  readonly groups = DEMO_GROUPS;
  readonly resumeUrl = RESUME_URL;
  /** A route with `data: { fullScreen: true }` gets the whole window, without the shell bar and rail. */
  readonly fullScreen = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => wantsFullScreen(this.router.routerState.snapshot.root)),
    ),
    { initialValue: false },
  );

  demosIn(group: string) {
    return DEMOS.filter(demo => demo.group === group);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}

function wantsFullScreen(route: ActivatedRouteSnapshot): boolean {
  return !!route.data['fullScreen'] || route.children.some(wantsFullScreen);
}
