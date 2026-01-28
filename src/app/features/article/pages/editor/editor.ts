import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { Errors } from '../../../../core/models/errors.model';
import { Articles } from '../../services/articles';
import { User } from '../../../../core/auth/services/user';
import { ListErrors } from '../../../../shared/components/list-errors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ArticleForm {
  title: FormControl<string>;
  description: FormControl<string>;
  body: FormControl<string>;
}

@Component({
  selector: 'app-editor-page',
  templateUrl: './editor.html',
  imports: [ListErrors, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Editor implements OnInit {
  tagList = signal<string[]>([]);
  articleForm: UntypedFormGroup = new FormGroup<ArticleForm>({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    body: new FormControl('', { nonNullable: true }),
  });
  tagField = new FormControl<string>('', { nonNullable: true });

  errors = signal<Errors | null>(null);
  isSubmitting = signal(false);
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly articleService: Articles,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: User,
  ) {}

  ngOnInit() {
    if (this.route.snapshot.params['slug']) {
      combineLatest([this.articleService.get(this.route.snapshot.params['slug']), this.userService.getCurrentUser()])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(([article, { user }]) => {
          if (user.username === article.author.username) {
            this.tagList.set(article.tagList);
            this.articleForm.patchValue(article);
          } else {
            void this.router.navigate(['/']);
          }
        });
    }
  }

  addTag() {
    // retrieve tag control
    const tag = this.tagField.value;
    // only add tag if it does not exist yet
    if (tag != null && tag.trim() !== '' && this.tagList().indexOf(tag) < 0) {
      this.tagList.update(tags => [...tags, tag]);
    }
    // clear the input
    this.tagField.reset('');
  }

  removeTag(tagName: string): void {
    this.tagList.update(tags => tags.filter(tag => tag !== tagName));
  }

  submitForm(): void {
    this.isSubmitting.set(true);
    // update any single tag
    this.addTag();

    const slug = this.route.snapshot.params['slug'];
    const articleData = {
      ...this.articleForm.value,
      tagList: this.tagList(),
    };

    const observable = slug
      ? this.articleService.update({ ...articleData, slug })
      : this.articleService.create(articleData);

    observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: article => this.router.navigate(['/article/', article.slug]),
      error: err => {
        this.errors.set(err);
        this.isSubmitting.set(false);
      },
    });
  }
}
