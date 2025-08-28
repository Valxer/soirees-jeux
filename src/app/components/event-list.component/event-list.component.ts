import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { GameEvent } from '../../models/event';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {
  private apiService = inject(ApiService);

  // On crée un signal pour stocker notre liste d'événements.
  public events = signal<GameEvent[]>([]);

  ngOnInit(): void {
    this.apiService.getEvents().subscribe(response => {
      this.events.set(response.data);
    });
  }
}