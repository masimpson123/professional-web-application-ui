import { Routes } from '@angular/router';
import { RootComponent } from './root/root.component';
import { AuthComponent } from './auth/auth.component';
import { CubeComponent } from './cube/cube.component';

export const routes: Routes = [
    {path: 'auth', component: AuthComponent},
    {path: 'cube', component: CubeComponent},
    {path: 'root', component: RootComponent},
    {path: '**', component: RootComponent},
];
