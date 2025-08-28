import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Créons une interface pour nos utilisateurs
export interface User {
  id: number;
  name: string;
  role: 'admin' | 'player';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // Le signal qui contient l'utilisateur actuellement "connecté"
  currentUser = signal<User | null>(null);

  // Un signal "calculé" pour savoir facilement si l'utilisateur est un admin
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // Récupère tous les utilisateurs pour notre sélecteur de connexion
  getUsers(): Observable<{ message: string, data: User[] }> {
    return this.http.get<{ message: string, data: User[] }>(`${this.apiUrl}/users`);
  }

  // Simule la connexion
  login(userId: number): Observable<{ message: string, data: User }> {
    return this.http.get<{ message: string, data: User }>(`${this.apiUrl}/users/${userId}`).pipe(
      tap(response => this.currentUser.set(response.data)) // Met à jour le signal
    );
  }

  // Déconnexion
  logout(): void {
    this.currentUser.set(null);
  }
}