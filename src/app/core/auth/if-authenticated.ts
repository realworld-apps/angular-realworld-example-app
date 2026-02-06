import { DestroyRef, Directive, inject, Input, OnInit, signal, TemplateRef, ViewContainerRef } from '@angular/core';
import { User } from './services/user';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({
  selector: '[ifAuthenticated]',
  standalone: true,
})
export class IfAuthenticated<T> implements OnInit {
  destroyRef = inject(DestroyRef);
  constructor(
    private templateRef: TemplateRef<T>,
    private userService: User,
    private viewContainer: ViewContainerRef,
  ) {}

  condition = signal(false);
  hasView = signal(false);

  ngOnInit() {
    this.userService.isAuthenticated.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isAuthenticated: boolean) => {
      const authRequired = isAuthenticated && this.condition();
      const unauthRequired = !isAuthenticated && !this.condition();

      if ((authRequired || unauthRequired) && !this.hasView()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView.set(true);
      } else if (this.hasView()) {
        this.viewContainer.clear();
        this.hasView.set(false);
      }
    });
  }

  @Input() set ifAuthenticated(condition: boolean) {
    this.condition.set(condition);
  }
}
