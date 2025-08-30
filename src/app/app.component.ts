import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserSelectionComponent } from './components/user-selection/user-selection.component';
import { LoginPopupComponent } from './components/login-popup/login-popup.component';
import { PasswordPopupComponent } from './components/password-popup/password-popup.component';
import { AuthService, User } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    UserSelectionComponent,
    LoginPopupComponent,
    PasswordPopupComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public authService = inject(AuthService);
  // État pour gérer l'affichage du popup de mot de passe
  passwordPrompt = signal<{ mode: 'setup' | 'enter', user: User } | null>(null);

  // Méthode appelée par le sélecteur d'utilisateur
  handleUserSelection(user: User): void {
    if (user.role === 'player') {
      this.authService.login({ userId: user.id }).subscribe();
    } else { // C'est un admin
      if (user.hasPassword) {
        this.passwordPrompt.set({ mode: 'enter', user });
      } else {
        this.passwordPrompt.set({ mode: 'setup', user });
      }
    }
  }
  
  // Méthodes pour gérer le popup de mot de passe
  onPasswordSuccess(): void {
    this.passwordPrompt.set(null);
  }

  onPasswordCancel(): void {
    this.passwordPrompt.set(null);
  }
}
