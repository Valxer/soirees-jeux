import { Routes } from '@angular/router';
import { EventListComponent } from './components/event-list/event-list.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // La page principale qui affiche les événements
  { path: 'events', component: EventListComponent },

  // La nouvelle page de gestion, protégée par notre guard
  { 
    path: 'admin/users',
    // On importe le composant à la volée pour de meilleures performances
    loadComponent: () => import('./components/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [adminGuard] 
  },

  // Redirection par défaut vers la page des événements
  { path: '', redirectTo: 'events', pathMatch: 'full' },

  // Route "fourre-tout" pour les URL inconnues
  { path: '**', redirectTo: 'events' }
];