import { Routes } from '@angular/router';
import { RootComponent } from './root/root.component';
import { AuthComponent } from './auth/auth.component';

export const routes: Routes = [
    {path: 'auth', component: AuthComponent},
    {path: 'root', component: RootComponent},
    {path: '**', component: RootComponent},
];
