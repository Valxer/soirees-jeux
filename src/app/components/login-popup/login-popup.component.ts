import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-login-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-popup.component.html',
  styleUrls: ['./login-popup.component.scss']
})
export class LoginPopupComponent implements OnInit {
  @Output() userSelected = new EventEmitter<User>(); // <-- NOUVEAU OUTPUT
  private authService = inject(AuthService);
  users = signal<User[]>([]);
  selectedUserId = signal<number | null>(null);
  
  ngOnInit(): void {
    this.authService.getUsers().subscribe(res => this.users.set(res.data));
  }

  onSelectUser(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedUserId.set(value ? Number(value) : null);
  }

  onConfirm(): void {
    const selectedId = this.selectedUserId();
    const selectedUser = this.users().find(u => u.id === selectedId);
    if (selectedUser) {
      this.userSelected.emit(selectedUser);
    }
  }
}