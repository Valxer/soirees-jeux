import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-selection',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-selection.component.html',
  styleUrls: ['./user-selection.component.scss']
})
export class UserSelectionComponent {
  public authService = inject(AuthService); 

  onLogout(): void {
    this.authService.logout();
  }
}