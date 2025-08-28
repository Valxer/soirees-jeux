import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameEvent } from '../models/event';
import { AuthService } from './auth.service';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api';

  // Helper pour créer les en-têtes d'admin
  private getAdminHeaders(): HttpHeaders {
    const userId = this.authService.currentUser()?.id;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-user-id': userId ? String(userId) : ''
    });
  }

  getEvents(): Observable<ApiResponse<GameEvent[]>> {
    return this.http.get<ApiResponse<GameEvent[]>>(`${this.apiUrl}/events`);
  }

  createEvent(eventData: { name: string; date: string; max_players: number }): Observable<ApiResponse<GameEvent>> {
    return this.http.post<ApiResponse<GameEvent>>(`${this.apiUrl}/events`, eventData, { headers: this.getAdminHeaders() });
  }

  deleteEvent(eventId: number): Observable<{ message: string; changes: number }> {
    return this.http.delete<{ message: string; changes: number }>(`${this.apiUrl}/events/${eventId}`, { headers: this.getAdminHeaders() });
  }

  register(eventId: number, userId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/events/${eventId}/register`, { userId });
  }

  unregister(eventId: number, userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/events/${eventId}/register`, { body: { userId } });
  }
}