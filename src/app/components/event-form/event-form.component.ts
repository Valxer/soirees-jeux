import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GameEvent } from '../../models/event';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss']
})
export class EventFormComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  @Output() eventCreated = new EventEmitter<GameEvent>();
  @Output() closePopup = new EventEmitter<void>();

  eventForm: FormGroup;
  confirmationMessage = signal<string | null>(null);

  constructor() {
    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      date: ['', Validators.required],
      max_players: [2, [Validators.required, Validators.min(2)]]
    });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    this.apiService.createEvent(this.eventForm.value).subscribe({
      next: (response) => {
        this.eventCreated.emit(response.data);
        this.eventForm.reset({max_players: 2});

        this.confirmationMessage.set('Événement créé avec succès !');
        setTimeout(() => {
          this.confirmationMessage.set(null);
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur lors de la création de l\'événement', err);
        alert(err.error.message || 'Une erreur est survenue.');
      }
    });
  }

  onCancel(): void {
    this.closePopup.emit();
  }
}