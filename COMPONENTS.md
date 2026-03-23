# Component Reference

All components are **standalone** (no Angular modules) and use **signals** for local state management.

---

## Shell & Layout

### AppComponent

- **File:** `src/app/app.component.ts`
- **What it does:** The outermost shell of the application. Renders the header, a `<router-outlet>` placeholder where pages appear, and the footer. Every page is displayed inside this wrapper.
- **Key dependencies:** `HeaderComponent`, `FooterComponent`, `RouterOutlet`

---

### HeaderComponent

- **File:** `src/app/core/layout/header.component.ts`
- **What it does:** The navigation bar at the top of every page. Shows different links depending on whether the user is logged in (e.g., hides "New Article" and "Settings" for guests).
- **Key dependencies:** `UserService` (for current user and auth state), `RouterLink`, `AsyncPipe`, `IfAuthenticatedDirective`

---

### FooterComponent

- **File:** `src/app/core/layout/footer.component.ts`
- **What it does:** Static footer displayed at the bottom of every page. Shows the app name "conduit" and the current year.
- **Key dependencies:** None (pure display)

---

## Authentication

### AuthComponent

- **File:** `src/app/core/auth/auth.component.ts`
- **What it does:** A single smart component that serves as both the login page (`/login`) and the register page (`/register`). It shows or hides the username field depending on the current route.
- **Key dependencies:** `UserService`, `Router`, `ActivatedRoute`, `ReactiveFormsModule`, `ListErrorsComponent`

---

## Home / Feed

### HomeComponent

- **File:** `src/app/features/article/pages/home/home.component.ts`
- **What it does:** The main landing page. Manages three feed tabs — "Global Feed", "Your Feed" (authenticated users only), and a tag-filtered feed. Handles switching between them and passing the right config to the article list.
- **Key dependencies:** `UserService`, `ArticleListComponent`, `TagsService`, `RouterLink`, `RxLet` (rx-angular)

---

### ArticleListComponent

- **File:** `src/app/features/article/components/article-list.component.ts`
- **What it does:** A reusable paginated list of articles. Takes a configuration object as input, fetches the right articles from the API, and renders them as cards. Shows a loading state and handles page navigation.
- **Key dependencies:** `ArticlesService`, `ArticlePreviewComponent`, `ArticleListConfig` model, `LoadingState` enum

---

### ArticlePreviewComponent

- **File:** `src/app/features/article/components/article-preview.component.ts`
- **What it does:** A single article card shown in the feed. Displays the title, description, tag list, author info, and a favorite button.
- **Key dependencies:** `ArticleMetaComponent`, `FavoriteButtonComponent`, `RouterLink`

---

## Article Detail

### ArticleComponent

- **File:** `src/app/features/article/pages/article/article.component.ts`
- **What it does:** The full article view page. Loads and displays the complete article body (rendered as Markdown), the author info bar, and the comments section below. Allows the author to delete the article and authenticated users to add/delete comments.
- **Key dependencies:** `ArticlesService`, `CommentsService`, `UserService`, `ArticleMetaComponent`, `ArticleCommentComponent`, `FavoriteButtonComponent`, `MarkdownPipe`

---

### ArticleMetaComponent

- **File:** `src/app/features/article/components/article-meta.component.ts`
- **What it does:** Displays the author's avatar, username (as a link), and the article's publication date. Used in both the article card and the full article page. Supports slot-in content (e.g., a favorite button can be projected into it).
- **Key dependencies:** `RouterLink`, `DatePipe`, `DefaultImagePipe`

---

### ArticleCommentComponent

- **File:** `src/app/features/article/components/article-comment.component.ts`
- **What it does:** Renders a single comment with the author's avatar, body text, and date. Shows a delete (trash) icon only when the logged-in user is the comment's author.
- **Key dependencies:** `UserService`, `AsyncPipe`, `DatePipe`, `DefaultImagePipe`, `RouterLink`

---

### FavoriteButtonComponent

- **File:** `src/app/features/article/components/favorite-button.component.ts`
- **What it does:** A heart button that lets users favorite or unfavorite an article. If the user is not logged in, clicking it redirects them to `/register` instead.
- **Key dependencies:** `ArticlesService`, `UserService`, `Router`

---

## Article Editor

### EditorComponent

- **File:** `src/app/features/article/pages/editor/editor.component.ts`
- **What it does:** A form for creating new articles or editing existing ones. When a `slug` is present in the URL, it pre-loads the article data. Manages a dynamic list of tags with add/remove functionality using signals.
- **Key dependencies:** `ArticlesService`, `Router`, `ActivatedRoute`, `ReactiveFormsModule`, `ListErrorsComponent`

---

## User Profile

### ProfileComponent

- **File:** `src/app/features/profile/pages/profile/profile.component.ts`
- **What it does:** The outer shell of a user's profile page. Loads the user's profile data (avatar, bio, follow status) and displays it at the top. Renders sub-routes below for the articles and favorites tabs.
- **Key dependencies:** `ProfileService`, `UserService`, `FollowButtonComponent`, `RouterLink`, `RouterOutlet`, `DefaultImagePipe`

---

### ProfileArticlesComponent

- **File:** `src/app/features/profile/components/profile-articles.component.ts`
- **What it does:** The "My Articles" tab on a profile page. Fetches and displays a paginated list of articles authored by the profiled user.
- **Key dependencies:** `ArticleListComponent`, `ActivatedRoute`

---

### ProfileFavoritesComponent

- **File:** `src/app/features/profile/components/profile-favorites.component.ts`
- **What it does:** The "Favorited Articles" tab on a profile page. Fetches and displays a paginated list of articles that the profiled user has favorited.
- **Key dependencies:** `ArticleListComponent`, `ActivatedRoute`

---

### FollowButtonComponent

- **File:** `src/app/features/profile/components/follow-button.component.ts`
- **What it does:** A button to follow or unfollow a user. Redirects unauthenticated users to `/login` instead of making the API call.
- **Key dependencies:** `ProfileService`, `UserService`, `Router`

---

## Settings

### SettingsComponent

- **File:** `src/app/features/settings/settings.component.ts`
- **What it does:** The user settings form where a logged-in user can update their profile picture URL, username, bio, email, and password. Also contains the "Logout" button.
- **Key dependencies:** `UserService`, `ReactiveFormsModule`, `ListErrorsComponent`

---

## Shared / Utility

### ListErrorsComponent

- **File:** `src/app/shared/components/list-errors.component.ts`
- **What it does:** Displays a list of validation or API error messages inside a styled error box. Used in login, register, editor, and settings forms.
- **Key dependencies:** `Errors` model (input)

---

## Directives and Pipes

### IfAuthenticatedDirective

- **File:** `src/app/core/auth/if-authenticated.directive.ts`
- **What it does:** A structural directive (like `*ngIf`) that shows or hides a block of HTML based on auth state. `[ifAuthenticated]="true"` shows content only when logged in; `false` shows it only when logged out.
- **Key dependencies:** `UserService`

---

### MarkdownPipe

- **File:** `src/app/shared/pipes/markdown.pipe.ts`
- **What it does:** Transforms a raw Markdown string into rendered HTML for display in the article body.
- **Key dependencies:** `marked` (npm library)

---

### DefaultImagePipe

- **File:** `src/app/shared/pipes/default-image.pipe.ts`
- **What it does:** Returns a fallback placeholder image URL when a user's avatar URL is null or empty.
- **Key dependencies:** None
