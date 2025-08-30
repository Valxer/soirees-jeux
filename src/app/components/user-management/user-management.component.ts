import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  authService = inject(AuthService);
  apiService = inject(ApiService);

  users = signal<User[]>([]);
  editingUserId = signal<number | null>(null);

  // Formulaires
  editNameControl = new FormControl('', [Validators.required]);
  addNameControl = new FormControl('', [Validators.required]);
  addRoleControl = new FormControl<'player' | 'admin'>('player', [Validators.required]);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe(res => this.users.set(res.data));
  }

  onDelete(userId: number): void {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      this.apiService.deleteUser(userId).subscribe(() => this.loadUsers());
    }
  }

  onAdd(): void {
    if (!this.addNameControl.valid || !this.addRoleControl.valid) return;

    const userData = {
      name: this.addNameControl.value!,
      role: this.addRoleControl.value!
    };

    this.apiService.addUser(userData).subscribe(() => {
      this.addNameControl.reset();
      this.loadUsers();
    });
  }

  startEdit(user: User): void {
    this.editingUserId.set(user.id);
    this.editNameControl.setValue(user.name);
  }

  cancelEdit(): void {
    this.editingUserId.set(null);
  }

  saveEdit(userId: number): void {
    if (!this.editNameControl.valid) return;

    this.apiService.updateUser(userId, this.editNameControl.value!).subscribe(() => {
      this.editingUserId.set(null);
      this.loadUsers();
    });
  }
}