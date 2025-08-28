import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EventListComponent } from './components/event-list/event-list.component';
import { UserSelectionComponent } from './components/user-selection/user-selection.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, EventListComponent, UserSelectionComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly title = signal('soirees-jeux');
}
