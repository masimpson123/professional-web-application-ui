import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ApiService } from '../api/api.service';
import { Role } from '../api/models';

const ROLE_KEY = 'demo-role';

/**
 * Who is using the app. There's no sign-in yet, so the sessions page lets you
 * choose a side; the choice is kept for the tab so a reload stays on it.
 */
@Injectable()
export class Viewer {
  private readonly api = inject(ApiService);

  readonly role = signal<Role>(savedRole());
  readonly user = rxResource({
    params: () => this.role(),
    stream: ({ params }) => this.api.getCurrentUser(params),
  });
  readonly initials = computed(() => (this.user.hasValue() ? this.user.value().initials : ''));

  setRole(role: Role): void {
    this.role.set(role);
    try {
      sessionStorage.setItem(ROLE_KEY, role);
    } catch {
      // Storage is blocked; the choice just won't survive a reload.
    }
  }
}

function savedRole(): Role {
  try {
    return sessionStorage.getItem(ROLE_KEY) === 'provider' ? 'provider' : 'member';
  } catch {
    return 'member';
  }
}
