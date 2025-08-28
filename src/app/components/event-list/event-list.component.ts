import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { GameEvent } from '../../models/event';
import { EventFormComponent } from '../event-form/event-form.component';

type LoadingState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, EventFormComponent],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {
  private apiService = inject(ApiService);
  public events = signal<GameEvent[]>([]);
  public state = signal<LoadingState>('loading'); 

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.state.set('loading');

    this.apiService.getEvents().subscribe({
      next: (response) => {
        this.events.set(response.data);
        this.state.set('loaded');
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des événements', err);
        this.state.set('error');
      }
    });
  }

  onRegister(eventId: number): void {
    this.apiService.registerToEvent(eventId).subscribe({
      next: (response) => {
        const updatedEvent = response.data;

        this.events.update(currentEvents => {
          return currentEvents.map(event => {
            if (event.id === eventId) {
              return updatedEvent;
            }
            return event;
          });
        });
      },
      error: (err) => {
        alert(err.error.message || 'Une erreur est survenue.');
        console.error("Erreur lors de l'inscription", err);
      }
    });
  }

  onDelete(eventId: number, eventName: string): void {
    const isConfirmed = confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${eventName}" ?`);

    if (isConfirmed) {
      this.apiService.deleteEvent(eventId).subscribe({
        next: () => {
          this.events.update(currentEvents =>
            currentEvents.filter(event => event.id !== eventId)
          );
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
          alert(err.error.message || 'Une erreur est survenue lors de la suppression.');
        }
      });
    }
  }

  addEventToList(newEvent: GameEvent): void {
  this.events.update(currentEvents => {
    const updatedList = [...currentEvents, newEvent];

    updatedList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return updatedList;
  });
}
}