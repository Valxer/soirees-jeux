import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: number;
  name: string;
  role: 'admin' | 'player';
  hasPassword?: boolean;
  sessionToken?: string; 
}

const USER_SESSION_KEY = 'soirees_jeux_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private apiService = inject(ApiService);

  currentUser = signal<User | null>(null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    this.checkLocalStorage();
  }

  private checkLocalStorage(): void {
    const sessionString = localStorage.getItem(USER_SESSION_KEY);
    if (sessionString) {
      const session = JSON.parse(sessionString);
      
      // On vérifie d'abord si un userId existe, c'est la base
      if (session.userId) {
        // Ensuite, on prépare les identifiants pour la connexion
        const credentials: { userId: number; sessionToken?: string } = {
          userId: session.userId,
        };

        // S'il y a aussi un jeton (cas admin), on l'ajoute
        if (session.sessionToken) {
          credentials.sessionToken = session.sessionToken;
        }

        // On tente la connexion avec les identifiants que nous avons
        this.login(credentials).subscribe({
          error: () => this.logout(), // Si la session n'est plus valide, on nettoie
        });
      }
    }
  }

  getUsers(): Observable<{ message: string, data: User[] }> {
    return this.apiService.getUsers();
  }

  login(credentials: { userId: number; password?: string; sessionToken?: string }): Observable<any> {
    return this.apiService.login(credentials).pipe(
      tap(response => {
        if (response.data && !response.needsPasswordSetup) {
          const user = response.data;
          this.currentUser.set(user);

          // Si c'est un admin, on stocke son ID ET son jeton de session
          if (user.role === 'admin' && user.sessionToken) {
            const session = { userId: user.id, sessionToken: user.sessionToken };
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
          } else { // Si c'est un joueur, on ne stocke que son ID
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify({ userId: user.id }));
          }
          
          if (user.role !== 'admin' && this.router.url.startsWith('/admin')) {
            this.router.navigate(['/events']);
          }
        }
      })
    );
  }
  

  setPassword(userId: number, password: string): Observable<any> {
    return this.apiService.setPassword(userId, password).pipe(
      tap(() => this.login({ userId, password }))
    );
  }

  logout(): void {
    const user = this.currentUser();
    // On invalide le jeton sur le serveur avant de nettoyer le front
    if (user && user.role === 'admin') {
      this.apiService.logout(user.id).subscribe();
    }
    this.currentUser.set(null);
    localStorage.removeItem(USER_SESSION_KEY);
  }
}