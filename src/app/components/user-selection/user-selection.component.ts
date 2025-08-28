import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-user-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-selection.component.html',
  styleUrls: ['./user-selection.component.scss']
})
export class UserSelectionComponent implements OnInit {
  // On injecte directement le service pour l'utiliser dans le template
  public authService = inject(AuthService); 
  
  users = signal<User[]>([]);

  ngOnInit(): void {
    this.authService.getUsers().subscribe(res => this.users.set(res.data));
  }

  onSelectUser(event: Event): void {
    const selectedId = (event.target as HTMLSelectElement).value;
    if (selectedId) {
      this.authService.login(Number(selectedId)).subscribe();
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}