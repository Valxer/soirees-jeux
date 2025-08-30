import { Injectable, Injector, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameEvent } from '../models/event';
import { AuthService, User } from './auth.service';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private injector = inject(Injector);
  private apiUrl = 'http://localhost:3000/api';

  // Helper pour créer les en-têtes d'admin
  private getAdminHeaders(): HttpHeaders {
    const authService = this.injector.get(AuthService);
    const userId = authService.currentUser()?.id;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-user-id': userId ? String(userId) : ''
    });
  }

  // --- Events Management ---
  getEvents(): Observable<ApiResponse<GameEvent[]>> {
    return this.http.get<ApiResponse<GameEvent[]>>(`${this.apiUrl}/events`);
  }

  createEvent(eventData: { name: string; date: string; max_players: number }): Observable<ApiResponse<GameEvent>> {
    return this.http.post<ApiResponse<GameEvent>>(`${this.apiUrl}/events`, eventData, { headers: this.getAdminHeaders() });
  }

  deleteEvent(eventId: number): Observable<{ message: string; changes: number }> {
    return this.http.delete<{ message: string; changes: number }>(`${this.apiUrl}/events/${eventId}`, { headers: this.getAdminHeaders() });
  }

  // --- Registration Management ---
  register(eventId: number, userId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/events/${eventId}/register`, { userId });
  }

  unregister(eventId: number, userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/events/${eventId}/register`, { body: { userId } });
  }
  
  setPassword(userId: number, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/set-password`, { password });
  }
  
  // --- User Management ---
  addUser(userData: { name: string, role: 'admin' | 'player' }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users`, userData, { headers: this.getAdminHeaders() });
  }

  updateUser(userId: number, name: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}`, { name }, { headers: this.getAdminHeaders() });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, { headers: this.getAdminHeaders() });
  }

  login(credentials: {userId: number, password?: string, sessiontoken?: string}): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials)
  }

  logout(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, { userId });
  }
}