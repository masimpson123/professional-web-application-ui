import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: 'auth', loadComponent: () => import('./auth/auth.component').then(c => c.AuthComponent)},
    {path: 'cube', loadComponent: () => import('./cube/cube.component').then(c => c.CubeComponent)},
    {path: 'root', loadComponent: () => import('./root/root.component').then(c => c.RootComponent)},
    {path: 'data-stream', loadComponent: () => import('./data-stream/data-stream.component').then(c => c.DataStreamComponent)},
    {path: 'ai', loadComponent: () => import('./ai/ai.component').then(c => c.AiComponent)},
    {path: 'resume', loadComponent: () => import('./resume/resume.component').then(c => c.ResumeComponent)},
    {path: 'form', loadComponent: () => import('./form/form.component').then(c => c.FormComponent)},
    {path: 'machine-learning', loadComponent: () => import('./machine-learning/machine-learning.component').then(c => c.MachineLearningComponent)},
    {path: '**', loadComponent: () => import('./root/root.component').then(c => c.RootComponent)},
];
