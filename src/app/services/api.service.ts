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

  // TODO: Nous ajouterons les autres méthodes (createEvent, deleteEvent, etc.) ici plus tard.
}