import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-popup.component.html',
  styleUrls: ['./password-popup.component.scss']
})
export class PasswordPopupComponent {
  @Input() mode: 'setup' | 'enter' = 'enter';
  @Input() user: { id: number; name: string } | null = null;
  @Output() success = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  
  error = '';
  form = this.fb.group({
    password: ['', Validators.required],
    confirmPassword: ['']
  });

  get title(): string {
    return this.mode === 'setup' ? 'Créez votre mot de passe' : `Connexion pour ${this.user?.name}`;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.user) return;
    this.error = '';
    
    const { password, confirmPassword } = this.form.value;

    if (this.mode === 'setup') {
      if (password !== confirmPassword) {
        this.error = "Les mots de passe ne correspondent pas.";
        return;
      }
      this.authService.setPassword(this.user.id, password!).subscribe({
        next: () => this.success.emit(),
        error: (err) => this.error = err.error.message || 'Une erreur est survenue.'
      });
    } else { // mode 'enter'
      this.authService.login({ userId: this.user.id, password: password! }).subscribe({
        next: () => this.success.emit(),
        error: (err) => this.error = err.error.message || 'Une erreur est survenue.'
      });
    }
  }
}