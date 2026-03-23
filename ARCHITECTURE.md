# Architecture Documentation

## What This Application Does

This is **Conduit** — a blogging platform similar to Medium. It is the official [RealWorld](https://github.com/gothinkster/realworld) demo app, built with Angular.

Users can:

- Browse a global feed of articles
- Filter articles by tag
- Register and log in
- Follow other users and see a personalized feed
- Write, edit, and delete articles (with tag support)
- Favorite/unfavorite articles
- Comment on articles
- View user profiles
- Update their own profile settings (avatar, bio, email, password)

---

## Project Structure

```
AngularTest/
├── src/
│   └── app/
│       ├── app.component.ts        # Root shell (header + router + footer)
│       ├── app.config.ts           # App bootstrap config (HTTP, routing, auth init)
│       ├── app.routes.ts           # Top-level route definitions
│       ├── core/                   # App-wide infrastructure
│       │   ├── auth/               # Login/register page, auth directive, user model
│       │   │   └── services/       # JWT storage, user state management
│       │   ├── interceptors/       # HTTP pipeline (add base URL, token, error handling)
│       │   ├── layout/             # Header and footer components
│       │   └── models/             # Shared interfaces (errors, loading state)
│       ├── features/               # Feature modules
│       │   ├── article/            # Everything article-related
│       │   │   ├── components/     # Reusable article UI pieces
│       │   │   ├── models/         # Article, comment, list-config interfaces
│       │   │   ├── pages/          # Full-page views (home, article detail, editor)
│       │   │   └── services/       # API calls for articles, comments, tags
│       │   ├── profile/            # User profile feature
│       │   │   ├── components/     # Profile article/favorites lists, follow button
│       │   │   ├── models/         # Profile interface
│       │   │   ├── pages/          # Profile page
│       │   │   ├── profile.routes.ts  # Profile-specific child routes
│       │   │   └── services/       # API calls for profiles (follow/unfollow)
│       │   └── settings/           # Settings page (single component)
│       └── shared/
│           ├── components/         # ListErrors (form validation display)
│           └── pipes/              # DefaultImage, Markdown rendering
├── realworld/                      # Git submodule — shared CSS theme + SVG assets
├── e2e/                            # Playwright end-to-end tests
├── angular.json                    # Angular CLI build config
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript config
```

### Folder Purpose Summary

| Folder       | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| `core/`      | Things every part of the app needs: auth, HTTP setup, layout |
| `features/`  | Self-contained feature areas (articles, profiles, settings)  |
| `shared/`    | Generic UI utilities reused across features                  |
| `realworld/` | External CSS/assets submodule (not Angular code)             |

---

## Key Components and Their Responsibilities

### Shell / Layout

- **AppComponent** — The outermost wrapper. Renders the header, the current page (via router), and the footer.
- **HeaderComponent** — Top navigation bar. Shows different links depending on whether the user is logged in.
- **FooterComponent** — Static footer with the app name and current year.

### Authentication

- **AuthComponent** — Handles both login and register on a single smart form. Detects which mode it's in from the URL (`/login` vs `/register`).

### Home Feed

- **HomeComponent** — The main landing page. Shows tabs for "Global Feed", "Your Feed" (logged-in only), and tag-filtered feeds.
- **ArticleListComponent** — Reusable paginated list of articles. Accepts configuration to know which articles to fetch.
- **ArticlePreviewComponent** — A single article card (title, description, author, date, favorite button).

### Article Detail

- **ArticleComponent** — Displays the full article body (rendered as Markdown), author info, and the comments section.
- **ArticleMetaComponent** — Shows author avatar, name, and date. Used in both the article card and detail page.
- **ArticleCommentComponent** — A single comment. Shows a delete button only if the comment belongs to the current user.
- **FavoriteButtonComponent** — A reusable heart button to like/unlike an article.

### Editor

- **EditorComponent** — Create or edit an article. When a URL slug is present (`/editor/:slug`), it loads the existing article for editing.

### Profile

- **ProfileComponent** — A user's profile page. Shows their avatar, bio, and a follow button.
- **ProfileArticlesComponent** — Tab showing articles written by the user.
- **ProfileFavoritesComponent** — Tab showing articles the user has favorited.
- **FollowButtonComponent** — A reusable follow/unfollow button.

### Settings

- **SettingsComponent** — Form for updating your own profile (avatar URL, username, bio, email, password). Also contains the logout button.

---

## Routing Structure

| URL                            | Page                           | Login Required?                         |
| ------------------------------ | ------------------------------ | --------------------------------------- |
| `/`                            | Home feed (global)             | No                                      |
| `/tag/:tag`                    | Home feed filtered by tag      | No                                      |
| `/login`                       | Login page                     | No (redirect away if already logged in) |
| `/register`                    | Register page                  | No (redirect away if already logged in) |
| `/settings`                    | User settings                  | **Yes** → redirects to `/login`         |
| `/editor`                      | Create new article             | **Yes** → redirects to `/login`         |
| `/editor/:slug`                | Edit existing article          | **Yes** → redirects to `/login`         |
| `/article/:slug`               | Full article + comments        | No                                      |
| `/profile/:username`           | User profile (their articles)  | No                                      |
| `/profile/:username/favorites` | User profile (their favorites) | No                                      |

All pages are **lazy-loaded** — the browser only downloads the code for a page when the user navigates to it.

---

## Services and Data Flow

```
User Action (click/form submit)
        ↓
  Component (signals for local state)
        ↓
  Service (API call via HttpClient)
        ↓
  HTTP Interceptors (add base URL → add auth token → catch errors)
        ↓
  Backend API (https://api.realworld.show/api)
        ↓
  Response flows back through Observable/Promise
        ↓
  Component updates its signal state → UI re-renders
```

### The Three HTTP Interceptors (applied in order)

1. **apiInterceptor** — Automatically prepends `https://api.realworld.show/api` to every request. You never write the full URL in a service — just the path like `/articles`.
2. **tokenInterceptor** — Reads the saved JWT from `localStorage` and adds it as an `Authorization: Token <jwt>` header on every request.
3. **errorInterceptor** — If a 401 (unauthorized) response comes back, it automatically logs the user out. Normalizes all error responses into a consistent format.

### Authentication State Flow

```
App starts
    ↓
AppInitializer runs
    ↓
JWT found in localStorage?
    ├── Yes → GET /user to validate → set currentUser + authState = 'authenticated'
    └── No  → authState = 'unauthenticated'

Components subscribe to UserService.authState$ to react to login/logout events
```

**`UserService`** is the single source of truth for who is logged in. It uses a `BehaviorSubject` so any component can subscribe and always get the current value immediately.

### State Management Approach

The app uses **no external state library** (no Redux/NgRx). Instead:

- **Angular Signals** handle local component state (loading flags, form values, current article, etc.)
- **RxJS BehaviorSubjects** in `UserService` handle the globally shared auth state
- **HTTP Observables** from services carry data into components
- The combination of signals + zoneless change detection makes the app very efficient — Angular only re-renders exactly what changed

---

## API Integration

**Backend:** [RealWorld API spec](https://realworld-docs.netlify.app/docs/specs/backend-specs/endpoints)
**Base URL:** `https://api.realworld.show/api`
**Auth:** JWT token in `Authorization: Token <jwt>` header
**JWT Storage:** `localStorage` under the key `jwtToken`

### Full API Endpoint Map

| Feature      | Method | Endpoint                              |
| ------------ | ------ | ------------------------------------- |
| **Auth**     | POST   | `/users/login`                        |
|              | POST   | `/users` (register)                   |
|              | GET    | `/user` (get current)                 |
|              | PUT    | `/user` (update)                      |
| **Articles** | GET    | `/articles` (global feed)             |
|              | GET    | `/articles/feed` (following feed)     |
|              | GET    | `/articles/:slug`                     |
|              | POST   | `/articles/`                          |
|              | PUT    | `/articles/:slug`                     |
|              | DELETE | `/articles/:slug`                     |
|              | POST   | `/articles/:slug/favorite`            |
|              | DELETE | `/articles/:slug/favorite`            |
| **Comments** | GET    | `/articles/:slug/comments`            |
|              | POST   | `/articles/:slug/comments`            |
|              | DELETE | `/articles/:slug/comments/:commentId` |
| **Tags**     | GET    | `/tags`                               |
| **Profiles** | GET    | `/profiles/:username`                 |
|              | POST   | `/profiles/:username/follow`          |
|              | DELETE | `/profiles/:username/follow`          |
