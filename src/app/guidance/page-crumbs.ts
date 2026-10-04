import { Injectable, signal } from '@angular/core';
import { BreadcrumbItem } from '@compsych-ui-components/angular';

/**
 * The header's breadcrumb trail, set by whichever page is showing. A crumb's
 * `id` is the URL it leads to. The home page leaves it empty, and the header
 * shows the brand instead.
 */
@Injectable()
export class PageCrumbs {
  readonly trail = signal<BreadcrumbItem[]>([]);
}
