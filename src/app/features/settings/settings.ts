import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../core/auth/user.model';
import { UserAuth } from '../../core/auth/services/user-auth';
import { ListErrors } from '../../shared/components/list-errors';
import { Errors } from '../../core/models/errors.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface SettingsForm {
  image: FormControl<string>;
  username: FormControl<string>;
  bio: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.html',
  imports: [ListErrors, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Settings implements OnInit {
  user!: User;
  settingsForm = new FormGroup<SettingsForm>({
    image: new FormControl('', { nonNullable: true }),
    username: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });
  errors = signal<Errors | null>(null);
  isSubmitting = signal(false);
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly router: Router,
    private readonly userService: UserAuth,
  ) {}

  ngOnInit(): void {
    const user = this.userService.getCurrentUserSync();
    if (user) {
      this.settingsForm.patchValue(user);
    }
  }

  logout(): void {
    this.userService.logout();
  }

  submitForm() {
    this.isSubmitting.set(true);

    this.userService
      .update(this.settingsForm.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ user }) => void this.router.navigate(['/profile/', user.username]),
        error: err => {
          this.errors.set(err);
          this.isSubmitting.set(false);
        },
      });
  }
}
