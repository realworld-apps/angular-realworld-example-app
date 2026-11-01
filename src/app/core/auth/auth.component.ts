import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Validators, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ListErrorsComponent } from '../../shared/components/list-errors.component';
import { Errors } from '../models/errors.model';
import { UserService } from './services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface AuthForm {
  email: FormControl<string>;
  password: FormControl<string>;
  username?: FormControl<string>;
}

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth.component.html',
  imports: [RouterLink, ListErrorsComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthComponent implements OnInit {
  authType = '';
  title = '';
  errors = signal<Errors>({ errors: {} });
  isSubmitting = signal(false);
  authForm: FormGroup<AuthForm>;
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {
    this.authForm = new FormGroup<AuthForm>({
      email: new FormControl('', {
        validators: [Validators.required, Validators.email],
        nonNullable: true,
      }),
      password: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
    });
  }

  ngOnInit(): void {
    this.authType = this.route.snapshot.url.at(-1)!.path;
    this.title = this.authType === 'login' ? 'Sign in' : 'Sign up';
    if (this.authType === 'register') {
      this.authForm.addControl(
        'username',
        new FormControl('', {
          validators: [Validators.required],
          nonNullable: true,
        }),
      );
    }
  }

  submitForm(): void {
    // Same check and message as the API ("email": ["is invalid"]), so a malformed address
    // never leaves the browser. Blank fields are still reported by the API ("can't be blank").
    if (this.authForm.controls.email.hasError('email')) {
      this.errors.set({ errors: { email: 'is invalid' } });
      return;
    }
    this.isSubmitting.set(true);
    this.errors.set({ errors: {} });

    let observable =
      this.authType === 'login'
        ? this.userService.login(this.authForm.value as { email: string; password: string })
        : this.userService.register(
            this.authForm.value as {
              email: string;
              password: string;
              username: string;
            },
          );

    observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => void this.router.navigate(['/']),
      error: err => {
        this.errors.set(err);
        this.isSubmitting.set(false);
      },
    });
  }
}
