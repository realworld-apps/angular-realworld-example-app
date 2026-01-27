[![RealWorld Frontend](https://img.shields.io/badge/realworld-frontend-%23783578.svg)](https://realworld.show)
[![Build Status](https://travis-ci.org/gothinkster/angular-realworld-example-app.svg?branch=master)](https://travis-ci.org/gothinkster/angular-realworld-example-app)

# ![Angular Example App](logo.png)

> ### Angular codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld-example-apps) spec and API.

### [RealWorld](https://github.com/gothinkster/realworld)

This codebase was created to demonstrate a fully fledged application built with Angular that interacts with an actual backend server including CRUD operations, authentication, routing, pagination, and more. We've gone to great lengths to adhere to the [Angular Styleguide](https://angular.io/styleguide) & best practices.

Additionally, there is an Angular 1.5 version of this codebase that you can [fork](https://github.com/gothinkster/angularjs-realworld-example-app) and/or [learn how to recreate](https://thinkster.io/angularjs-es6-tutorial).

# How it works

We're currently working on some docs for the codebase (explaining where functionality is located, how it works, etc) but the codebase should be straightforward to follow as is. We've also released a [step-by-step tutorial w/ screencasts](https://thinkster.io/tutorials/building-real-world-angular-2-apps) that teaches you how to recreate the codebase from scratch.

# Getting started

Make sure you have the [Angular CLI](https://github.com/angular/angular-cli#installation) installed globally. You can `bun install` to resolve all dependencies (should take a couple of seconds).

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Building the project

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Functionality overview

The example application is a social blogging site (i.e. a Medium.com clone) called "Conduit". It uses a custom API for all requests, including authentication. You can view a live demo over at https://demo.realworld.show

**General functionality:**

- Authenticate users via JWT (login/signup pages + logout button on settings page)
- CRU\* users (sign up & settings page - no deleting required)
- CRUD Articles
- CR\*D Comments on articles (no updating required)
- GET and display paginated lists of articles
- Favorite articles
- Follow other users

**The general page breakdown looks like this:**

- Home page (URL: /#/ )
  - List of tags
  - List of articles pulled from either Feed, Global, or by Tag
  - Pagination for list of articles
- Sign in/Sign up pages (URL: /#/login, /#/register )
  - Uses JWT (store the token in localStorage)
  - Authentication can be easily switched to session/cookie based
- Settings page (URL: /#/settings )
- Editor page to create/edit articles (URL: /#/editor, /#/editor/article-slug-here )
- Article page (URL: /#/article/article-slug-here )
  - Delete article button (only shown to article's author)
  - Render markdown from server client side
  - Comments section at bottom of page
  - Delete comment button (only shown to comment's author)
- Profile page (URL: /#/profile/:username, /#/profile/:username/favorites )
  - Show basic user info
  - List of articles populated from author's created articles or author's favorited articles
