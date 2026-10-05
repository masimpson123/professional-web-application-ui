import { Routes } from '@angular/router';
import { ApiService } from './api/api.service';
import { GuidanceApp } from './guidance-app';
import { PageCrumbs } from './page-crumbs';
import { Settings } from './session/settings';
import { Viewer } from './session/viewer';

/**
 * The app, mounted at `/guidance/app`. Its services are provided here rather than in
 * root, so they exist only while the app is open; relaunching starts fresh.
 * Each page loads on demand, so the first download is just the shell.
 */
export const routes: Routes = [
  {
    path: '',
    component: GuidanceApp,
    providers: [ApiService, Viewer, Settings, PageCrumbs],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Home | GuidanceResources',
        loadComponent: () => import('./home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'sessions',
        title: 'Sessions | GuidanceResources',
        loadComponent: () => import('./sessions/sessions-page').then((m) => m.SessionsPage),
      },
      {
        path: 'profile',
        title: 'My profile | GuidanceResources',
        loadComponent: () => import('./profile/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'check-in',
        title: 'New member check-in | GuidanceResources',
        loadComponent: () => import('./check-in/check-in-page').then((m) => m.CheckInPage),
      },
      {
        path: 'sessions/:id',
        title: 'Session | GuidanceResources',
        loadComponent: () => import('./room/room-page').then((m) => m.RoomPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
