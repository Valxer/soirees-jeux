import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
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
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private apiUrl = 'http://localhost:3000/api';

  currentUser = signal<User | null>(null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    this.checkLocalStorage();
  }

   private checkLocalStorage(): void {
    const session = localStorage.getItem(USER_SESSION_KEY);
    if (session) {
      const { userId, sessionToken } = JSON.parse(session);
      if (userId && sessionToken) {
        // On tente de se connecter avec l'ID et le jeton
        this.login({ userId, sessionToken }).subscribe({
          error: () => this.logout() // Si le jeton est invalide, on nettoie
        });
      }
    }
  }

  getUsers(): Observable<{ message: string, data: User[] }> {
    return this.http.get<{ message: string, data: User[] }>(`${this.apiUrl}/users`);
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