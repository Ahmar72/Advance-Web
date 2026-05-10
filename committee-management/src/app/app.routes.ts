import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login';
import { SignupComponent } from './pages/auth/signup';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { CommitteeCreateComponent } from './pages/committee/create';
import { CommitteeDiscoverComponent } from './pages/committee/discover';
import { CommitteeDetailComponent } from './pages/committee/detail';
import { MyCommitteesComponent } from './pages/committee/my-committees';
import { NotificationsComponent } from './pages/notifications/notifications';
import { ProfileComponent } from './pages/profile/profile';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'discover',
    component: CommitteeDiscoverComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'my-committees',
    component: MyCommitteesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'committee/create',
    component: CommitteeCreateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'committee/:id',
    component: CommitteeDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [AuthGuard],
  },
  { path: 'committees', redirectTo: '/discover', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
