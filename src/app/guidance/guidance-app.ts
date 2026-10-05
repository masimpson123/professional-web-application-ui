import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  BreadcrumbItem,
  FooterComponent,
  FooterLink,
  HeaderNavComponent,
  NavAction,
  SidebarComponent,
} from '@compsych-ui-components/angular';
import { filter, map } from 'rxjs';
import { PageCrumbs } from './page-crumbs';
import { GUIDANCE_EXIT, GUIDANCE_HOME, GUIDANCE_PROFILE, GUIDANCE_SESSIONS } from './paths';
import { Viewer } from './session/viewer';

/**
 * The GuidanceResources shell: header, sidebar menu, the page, and footer. It fills
 * the window, because its route hides the portfolio's own chrome (`fullScreen` data).
 */
@Component({
  selector: 'app-guidance',
  imports: [FooterComponent, HeaderNavComponent, RouterOutlet, SidebarComponent],
  templateUrl: './guidance-app.html',
  styleUrl: './guidance-app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'guidance', '(document:keydown.escape)': 'menuOpen.set(false)' },
})
export class GuidanceApp {
  private readonly router = inject(Router);
  protected readonly crumbs = inject(PageCrumbs);
  protected readonly viewer = inject(Viewer);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** The home page shows the brand; every other page shows where you are. */
  protected readonly level = computed(() => (this.crumbs.trail().length ? 'sub-page' : 'main'));
  protected readonly menuOpen = signal(false);
  protected readonly activeMenuItem = computed(() => (this.url() === GUIDANCE_HOME ? 'home' : ''));
  /** Sessions are counseling, so their pages carry crisis resources in the footer. */
  protected readonly crisisNote = computed(() =>
    this.url().startsWith(GUIDANCE_SESSIONS)
      ? 'If you are in crisis or thinking about harming yourself, call or text 988 to reach the Suicide & Crisis Lifeline, or call 911.'
      : '',
  );

  /**
   * "Connect Me Now" is for members. The view switch is demo only: there's no
   * sign-in yet, so it swaps between the member's and the provider's side.
   */
  protected readonly headerActions = computed<NavAction[]>(() => {
    const provider = this.viewer.role() === 'provider';
    return [
      ...(provider ? [] : [{ id: 'connect-me-now', label: 'Connect Me Now', variant: 'tonal' as const }]),
      {
        id: 'switch-view',
        label: provider ? 'Switch to member view' : 'Switch to provider view',
        variant: 'outlined',
        leadingIcon: 'arrow-left-right',
      },
      { id: 'exit-demo', label: 'Exit demo', variant: 'outlined', leadingIcon: 'minimize-2' },
    ];
  });

  protected readonly footerLinks: FooterLink[] = [
    { id: 'about', label: 'About Us' },
    { id: 'privacy', label: 'Privacy and Terms of Use' },
    { id: 'help', label: 'Help' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'feedback', label: 'Feedback' },
  ];

  constructor() {
    // The pages set their own titles; give the portfolio its title back on the way out.
    const title = inject(Title);
    const portfolioTitle = title.getTitle();
    inject(DestroyRef).onDestroy(() => title.setTitle(portfolioTitle));
  }

  protected onHeaderAction(id: string): void {
    if (id === 'menu-toggle') this.menuOpen.update((open) => !open);
    else if (id === 'logo') this.router.navigateByUrl(GUIDANCE_HOME);
    else if (id === 'calendar-checked') this.router.navigateByUrl(GUIDANCE_SESSIONS);
    else if (id === 'avatar') this.router.navigateByUrl(GUIDANCE_PROFILE);
    else if (id === 'exit-demo') this.router.navigateByUrl(GUIDANCE_EXIT);
    else if (id === 'switch-view') {
      this.viewer.setRole(this.viewer.role() === 'provider' ? 'member' : 'provider');
    }
  }

  protected onMenuItem(id: string): void {
    if (id === 'home') this.router.navigateByUrl(GUIDANCE_HOME);
    this.menuOpen.set(false);
  }

  protected go(crumb: BreadcrumbItem): void {
    if (crumb.id) this.router.navigateByUrl(crumb.id);
  }

  protected goHome(): void {
    this.router.navigateByUrl(GUIDANCE_HOME);
  }
}
