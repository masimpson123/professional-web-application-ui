import { Routes } from '@angular/router';
import { RootComponent } from './root/root.component';
import { AuthComponent } from './auth/auth.component';
import { CubeComponent } from './cube/cube.component';
import { WebsocketComponent } from './websocket/websocket.component';
import { ResumeComponent } from './resume/resume.component';

export const routes: Routes = [
    {path: 'auth', component: AuthComponent},
    {path: 'cube', component: CubeComponent},
    {path: 'root', component: RootComponent},
    {path: 'websocket', component: WebsocketComponent},
    {path: 'resume', component: ResumeComponent},
    {path: '**', component: RootComponent},
];
