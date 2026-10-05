import { Injectable, signal } from '@angular/core';

const OPEN_KEY = 'home-sections-open';

/**
 * Whether the home page's sessions and care plans sections are open. They sit side
 * by side, so they open and close together. Kept for the tab, so a reload doesn't
 * undo it. The home page provides one.
 */
@Injectable()
export class HomeSections {
  readonly expanded = signal(savedExpanded());

  setExpanded(open: boolean): void {
    this.expanded.set(open);
    try {
      sessionStorage.setItem(OPEN_KEY, String(open));
    } catch {
      // Storage is blocked; the choice just won't survive a reload.
    }
  }
}

function savedExpanded(): boolean {
  try {
    return sessionStorage.getItem(OPEN_KEY) !== 'false';
  } catch {
    return true;
  }
}
