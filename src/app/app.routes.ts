import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: 'auth', loadComponent: () => import('./auth/auth.component').then(c => c.AuthComponent)},
    {path: 'cube', loadComponent: () => import('./cube/cube.component').then(c => c.CubeComponent)},
    {path: 'root', loadComponent: () => import('./root/root.component').then(c => c.RootComponent)},
    {path: 'data-stream', loadComponent: () => import('./data-stream/data-stream.component').then(c => c.DataStreamComponent)},
    {path: 'ai', loadComponent: () => import('./ai/ai.component').then(c => c.AiComponent)},
    {path: 'resume', loadComponent: () => import('./resume/resume.component').then(c => c.ResumeComponent)},
    {path: 'form', loadComponent: () => import('./form/form.component').then(c => c.FormComponent)},
    {path: 'websocket', loadComponent: () => import('./websocket/websocket.component').then(c => c.WebsocketComponent)},
    {path: 'guidance', loadComponent: () => import('./guidance/guidance-intro.component').then(c => c.GuidanceIntroComponent)},
    // The app fills the window: the portfolio hides its chrome for routes with `fullScreen`.
    {path: 'guidance/app', data: {fullScreen: true}, loadChildren: () => import('./guidance/guidance.routes').then(r => r.routes)},
    {path: 'video', redirectTo: 'guidance'},
    {path: 'machine-learning', loadComponent: () => import('./machine-learning/machine-learning.component').then(c => c.MachineLearningComponent)},
    {path: '**', loadComponent: () => import('./root/root.component').then(c => c.RootComponent)},
];
