# Migration Plan

This document outlines how to approach migrating or re-implementing this Angular application. The recommended order minimizes blockers — each piece is only attempted after its dependencies are ready.

---

## Guiding Principles

1. **Migrate leaves first, roots last.** Start with components that don't depend on other custom components. Work upward toward the page-level shells.
2. **Migrate services before the components that use them.** Components need working data before they can be properly tested.
3. **Migrate shared utilities early.** Pipes and small shared components are used everywhere — having them ready unblocks all feature work.
4. **Keep the app working throughout.** Prefer incremental migration over a big-bang rewrite.

---

## Phase 1 — Foundation (No dependencies on other custom code)

These pieces have no dependencies on other custom components and should be done first.

### 1.1 Models / Interfaces

| Item                          | File                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| `User` interface              | `src/app/core/auth/user.model.ts`                              |
| `Profile` interface           | `src/app/features/profile/models/profile.model.ts`             |
| `Article` interface           | `src/app/features/article/models/article.model.ts`             |
| `Comment` interface           | `src/app/features/article/models/comment.model.ts`             |
| `ArticleListConfig` interface | `src/app/features/article/models/article-list-config.model.ts` |
| `Errors` interface            | `src/app/core/models/errors.model.ts`                          |
| `LoadingState` enum           | `src/app/core/models/loading-state.model.ts`                   |

**Why first:** All services and components import from these. They are pure TypeScript — no Angular APIs at all.

### 1.2 Utility Pipes

| Item               | File                                         |
| ------------------ | -------------------------------------------- |
| `MarkdownPipe`     | `src/app/shared/pipes/markdown.pipe.ts`      |
| `DefaultImagePipe` | `src/app/shared/pipes/default-image.pipe.ts` |

**Why early:** Needed by `ArticleMetaComponent` and `ArticleComponent`. Simple transformations with no side effects.

---

## Phase 2 — Services (API Layer)

Migrate services next so that components have real data to work with.

### Recommended order

| Step | Service           | Depends on   |
| ---- | ----------------- | ------------ |
| 2.1  | `JwtService`      | Nothing      |
| 2.2  | `UserService`     | `JwtService` |
| 2.3  | `TagsService`     | Nothing      |
| 2.4  | `ArticlesService` | Nothing      |
| 2.5  | `CommentsService` | Nothing      |
| 2.6  | `ProfileService`  | Nothing      |

### HTTP Interceptors (migrate alongside services)

| Interceptor        | What it does                      | Migrate when                 |
| ------------------ | --------------------------------- | ---------------------------- |
| `apiInterceptor`   | Prepends base URL to all requests | Before any service is tested |
| `tokenInterceptor` | Adds JWT auth header              | After `JwtService`           |
| `errorInterceptor` | Handles 401/errors globally       | After `UserService`          |

**Challenge:** The Angular interceptors are framework-specific. In other frameworks, the equivalent is an HTTP client wrapper or middleware (e.g., Axios interceptors in React).

---

## Phase 3 — Shared UI Components

These are small, reusable pieces with no page-level logic.

| Step | Component              | Depends on         |
| ---- | ---------------------- | ------------------ |
| 3.1  | `ListErrorsComponent`  | `Errors` model     |
| 3.2  | `FooterComponent`      | Nothing            |
| 3.3  | `ArticleMetaComponent` | `DefaultImagePipe` |

---

## Phase 4 — Feature Components (Building Blocks)

Reusable components within features. These depend on services and shared components but not on each other.

| Step | Component                 | Depends on                                        |
| ---- | ------------------------- | ------------------------------------------------- |
| 4.1  | `FavoriteButtonComponent` | `ArticlesService`, `UserService`                  |
| 4.2  | `FollowButtonComponent`   | `ProfileService`, `UserService`                   |
| 4.3  | `ArticleCommentComponent` | `UserService`, `DefaultImagePipe`                 |
| 4.4  | `ArticlePreviewComponent` | `ArticleMetaComponent`, `FavoriteButtonComponent` |
| 4.5  | `ArticleListComponent`    | `ArticlesService`, `ArticlePreviewComponent`      |

---

## Phase 5 — Page Components

Full pages. Migrate these after all building blocks are in place.

| Step | Page                             | Depends on                                                                                                                                        |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1  | `AuthComponent` (login/register) | `UserService`, `ListErrorsComponent`                                                                                                              |
| 5.2  | `SettingsComponent`              | `UserService`, `ListErrorsComponent`                                                                                                              |
| 5.3  | `EditorComponent`                | `ArticlesService`, `ListErrorsComponent`                                                                                                          |
| 5.4  | `ProfileArticlesComponent`       | `ArticleListComponent`                                                                                                                            |
| 5.5  | `ProfileFavoritesComponent`      | `ArticleListComponent`                                                                                                                            |
| 5.6  | `ProfileComponent`               | `ProfileService`, `FollowButtonComponent`, `ProfileArticlesComponent`, `ProfileFavoritesComponent`                                                |
| 5.7  | `ArticleComponent`               | `ArticlesService`, `CommentsService`, `UserService`, `ArticleMetaComponent`, `ArticleCommentComponent`, `FavoriteButtonComponent`, `MarkdownPipe` |
| 5.8  | `HomeComponent`                  | `TagsService`, `UserService`, `ArticleListComponent`                                                                                              |

---

## Phase 6 — Shell & Routing

| Step | Item                       | Depends on                                   |
| ---- | -------------------------- | -------------------------------------------- |
| 6.1  | `HeaderComponent`          | `UserService`, `IfAuthenticatedDirective`    |
| 6.2  | Route definitions + guards | All pages                                    |
| 6.3  | `AppComponent`             | `HeaderComponent`, `FooterComponent`, router |

---

## Dependency Map (Visual Summary)

```
Models/Interfaces
    └── Services (JwtService → UserService → all others)
            └── Shared UI (ListErrors, Footer, ArticleMeta)
                    └── Feature Components (FavoriteBtn, FollowBtn, ArticlePreview, ArticleList)
                            └── Pages (Auth, Settings, Editor, Profile, Article, Home)
                                    └── Shell (Header, AppComponent, Routes)
```

---

## Potential Challenges

### 1. Auth State Management

**Problem:** `UserService` uses RxJS `BehaviorSubject` to broadcast login/logout events across the whole app. Every component that shows/hides content based on auth status subscribes to this.
**Migration approach:** Replace with a global state store (React Context, Zustand, Pinia, etc.) or an equivalent observable/signal pattern in the target framework.

### 2. Reactive HTTP + Error Handling

**Problem:** The app uses RxJS extensively — `combineLatest`, `switchMap`, `catchError`, `takeUntilDestroyed`. These patterns don't exist in non-Angular frameworks.
**Migration approach:** Use Promises + async/await for simpler calls. For complex combinations (e.g., `ArticleComponent` loading article + comments + user simultaneously), use `Promise.all`.

### 3. Route Guards

**Problem:** Angular route guards (`requireAuth`) are Angular-specific — they intercept navigation before the component loads.
**Migration approach:** Implement equivalent guards using the target framework's router (e.g., React Router `loader` functions, `beforeEach` in Vue Router).

### 4. The `IfAuthenticatedDirective`

**Problem:** This is a structural directive — an Angular-specific concept for conditionally rendering DOM.
**Migration approach:** Replace with simple conditional rendering (`v-if` in Vue, `{condition && <Component />}` in React).

### 5. Lazy Loading

**Problem:** All page components are lazy-loaded with Angular's `loadComponent()`. This reduces initial bundle size.
**Migration approach:** Most modern frameworks support lazy loading natively (React `lazy()` + `Suspense`, Vue `defineAsyncComponent()`). Maintain the same lazy-loading strategy.

### 6. CSS / Styling

**Problem:** The app's styles come from the `realworld/` git submodule (`realworld/assets/theme/styles.css`). This is a global stylesheet, not component-scoped.
**Migration approach:** The CSS can be copied as-is — it's plain CSS and works in any framework. Import it as a global stylesheet.

### 7. Zoneless Change Detection

**Problem:** This app uses Angular's experimental zoneless mode + signals, which is cutting-edge Angular. It won't exist in other frameworks.
**Migration approach:** Not applicable outside Angular. In other frameworks, reactivity is handled differently by default (Vue's reactivity, React's state).

### 8. Markdown Rendering

**Problem:** The `MarkdownPipe` uses the `marked` library to render article bodies as HTML.
**Migration approach:** `marked` is a plain JavaScript library — it can be used in any framework. Port the pipe to a simple utility function.

---

## Quick Reference: Component Dependencies

| Component                   | Uses these services                                 | Uses these components                                                        |
| --------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `HomeComponent`             | `UserService`, `TagsService`                        | `ArticleListComponent`                                                       |
| `ArticleListComponent`      | `ArticlesService`                                   | `ArticlePreviewComponent`                                                    |
| `ArticlePreviewComponent`   | —                                                   | `ArticleMetaComponent`, `FavoriteButtonComponent`                            |
| `ArticleComponent`          | `ArticlesService`, `CommentsService`, `UserService` | `ArticleMetaComponent`, `ArticleCommentComponent`, `FavoriteButtonComponent` |
| `EditorComponent`           | `ArticlesService`                                   | `ListErrorsComponent`                                                        |
| `ProfileComponent`          | `ProfileService`, `UserService`                     | `FollowButtonComponent`                                                      |
| `ProfileArticlesComponent`  | — (config from route)                               | `ArticleListComponent`                                                       |
| `ProfileFavoritesComponent` | — (config from route)                               | `ArticleListComponent`                                                       |
| `AuthComponent`             | `UserService`                                       | `ListErrorsComponent`                                                        |
| `SettingsComponent`         | `UserService`                                       | `ListErrorsComponent`                                                        |
| `HeaderComponent`           | `UserService`                                       | `IfAuthenticatedDirective`                                                   |
| `FavoriteButtonComponent`   | `ArticlesService`, `UserService`                    | —                                                                            |
| `FollowButtonComponent`     | `ProfileService`, `UserService`                     | —                                                                            |
| `ArticleCommentComponent`   | `UserService`                                       | —                                                                            |
| `ArticleMetaComponent`      | —                                                   | —                                                                            |
| `ListErrorsComponent`       | —                                                   | —                                                                            |
| `FooterComponent`           | —                                                   | —                                                                            |
