import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameEvent } from '../models/event';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getEvents(): Observable<ApiResponse<GameEvent[]>> {
    return this.http.get<ApiResponse<GameEvent[]>>(`${this.apiUrl}/events`);
  }

  registerToEvent(eventId: number): Observable<ApiResponse<GameEvent>> {
    return this.http.patch<ApiResponse<GameEvent>>(`${this.apiUrl}/events/${eventId}/register`, {});
  }

  createEvent(eventData: { name: string; date: string; max_players: number }): Observable<ApiResponse<GameEvent>> {
    return this.http.post<ApiResponse<GameEvent>>(`${this.apiUrl}/events`, eventData);
  }
  
  deleteEvent(eventId: number): Observable<{ message: string; changes: number }> {
    return this.http.delete<{ message: string; changes: number }>(`${this.apiUrl}/events/${eventId}`);
  }
}