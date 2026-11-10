---
title: ADR-010 — Front Angular standalone organizado em core, features e shared
status: aceita (retroativa)
origem: retroativo
abrangencia: front inteiro
created: 2026-10-22
updated: 2026-10-22
---

# ADR-010 — Front Angular standalone organizado em core, features e shared

- **Status:** aceita (retroativa). Registrada a partir do código `web` no commit `d51aa2d`.
- **Abrangência:** front inteiro; nos artigos, as telas Home, Artigo e Editor.
- **Relacionadas:** [ADR-011](ADR-011-integracao-front-api-por-interceptors.md).

## Decisão

**Aplicação sem NgModule.** A aplicação usa componentes standalone, com `bootstrapApplication` (`web/src/main.ts:5`), e roda sem zone.js (`provideZonelessChangeDetection`, `web/src/app/app.config.ts:71`).

**Estrutura de pastas.**

```text
web/src/app/
  core/       # o que a app inteira usa: auth/ (login, UserService, JwtService), interceptors/, layout/, models/
  features/   # uma pasta por área: article/, profile/, settings/
    article/  #   components/, pages/, services/, models/
  shared/     # componentes e pipes reutilizáveis sem regra de área (ex.: list-errors)
```

**Rotas.** As páginas são carregadas sob demanda: `loadComponent` para páginas e `loadChildren` para o perfil. Os guards são funções inline, como `requireAuth` e o "só não autenticado" (`web/src/app/app.routes.ts:9-12`, `:14-61`). As páginas usam `export default` (`web/src/app/features/article/pages/editor/editor.component.ts:23`).

**Services.** Há um service `providedIn: 'root'` por recurso da API, dentro da pasta da feature. Cada método devolve um `Observable` e desembrulha o envelope (`web/src/app/features/article/services/articles.service.ts:8-53`).

**Estado.**

- O estado de sessão fica no `UserService`, com `BehaviorSubject` de usuário e de `AuthState` (`loading`, `authenticated`, `unauthenticated`, `unavailable`) (`web/src/app/core/auth/services/user.service.ts:10`, `:47-55`).
- O estado local dos componentes usa `signal()` com `ChangeDetectionStrategy.OnPush` e formulários reativos (`web/src/app/features/article/pages/editor/editor.component.ts:17-33`).
- Não há biblioteca de estado global: nenhuma aparece nas dependências de `web/package.json`.

## Regras que decorrem

- Uma tela nova entra em `features/<area>/pages/`, com o service em `features/<area>/services/`. O que é transversal vai para `core/`, e o reutilizável sem regra de área vai para `shared/`.
- Os testes unitários Vitest ficam ao lado do código (`*.spec.ts`), e os e2e novos só em Cypress, em `testes/interface/` (`web/AGENTS.md`).

## Consequências

- Convivem dois modelos reativos: RxJS no estado de sessão e nos services, signals no estado dos componentes.
