import { Routes } from '@angular/router';
import { RootComponent } from './root/root.component';
import { AuthComponent } from './auth/auth.component';
import { CubeComponent } from './cube/cube.component';
import { WebsocketComponent } from './websocket/websocket.component';
import { ResumeComponent } from './resume/resume.component';
import { DataStreamComponent } from './data-stream/data-stream.component';
import { AiComponent } from './ai/ai.component';
import { FormComponent } from './form/form.component';

export const routes: Routes = [
    {path: 'auth', component: AuthComponent},
    {path: 'cube', component: CubeComponent},
    {path: 'root', component: RootComponent},
    {path: 'websocket', component: WebsocketComponent},
    {path: 'data-stream', component: DataStreamComponent},
    {path: 'ai', component: AiComponent},
    {path: 'resume', component: ResumeComponent},
    {path: 'form', component: FormComponent},
    {path: '**', component: RootComponent},
];
