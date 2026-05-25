import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../core/auth/user.model';
import { UserService } from '../../core/auth/services/user.service';
import { ListErrorsComponent } from '../../shared/components/list-errors.component';
import { Errors } from '../../core/models/errors.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface SettingsForm {
  image: FormControl<string>;
  username: FormControl<string>;
  bio: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}

const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.component.html',
  imports: [ListErrorsComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsComponent implements OnInit {
  user!: User;
  settingsForm = new FormGroup<SettingsForm>({
    image: new FormControl('', { nonNullable: true }),
    username: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.pattern(STRONG_PASSWORD_PATTERN)],
      nonNullable: true,
    }),
  });
  errors = signal<Errors | null>(null);
  isSubmitting = signal(false);
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    const user = this.userService.getCurrentUserSync();
    if (user) {
      this.settingsForm.patchValue({
        ...user,
        image: user.image ?? '',
        bio: user.bio ?? '',
      });
    }
  }

  logout(): void {
    this.userService.logout();
  }

  submitForm() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const payload = { ...this.settingsForm.value };
    if (!payload.password) {
      delete payload.password;
    }

    this.userService
      .update(payload)
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
