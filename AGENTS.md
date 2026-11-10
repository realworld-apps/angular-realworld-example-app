<!-- bmad:context -->
<!-- Verified 2026-10-21 against dd99ed2. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## angular-conduit (web)

Front-end Angular 21 em TypeScript da aplicação Conduit (RealWorld), com bun como gerenciador de pacotes. A API .NET fica no repositório irmão `../api`. O submódulo `realworld/` traz a spec RealWorld; as specs Playwright dele ficam só como referência de comportamento, sem executor neste repositório.

## Política

- Nunca edite `realworld/`: é o submódulo upstream das specs, e `ignore = dirty` esconde alterações locais do `git status`. Ajustes de teste vão em `testes/interface/`.
- E2E: Cypress em TypeScript em testes/interface (Etapa 6). Playwright removido (ADR-016). Não reinstale o Playwright nem crie testes com ele.
- Relatórios e artefatos de teste vão em `testes/report/`.

## Onde ficam as coisas

- Testes unitários: Vitest em `src/**/*.spec.ts`, ao lado do código; não os mova para `testes/`.
- `window.__conduit_debug__` (definido em `src/app/app.config.ts`) expõe o estado da app para testes e2e; exemplos de uso em `realworld/specs/e2e/helpers/debug.ts`.

## Rodar e verificar

- Use `bun`/`bunx`, nunca `npm`/`npx`: o CI e o `bun.lock` são bun.
- Rode `bun run setup` depois de clonar ou de atualizar o submódulo `realworld`; sem ele as specs de baseline não existem.
- Ainda não há comando de E2E: o Cypress é instalado e configurado na Etapa 6 (bmad-tea-framework).
- Rode `bun run format` antes de apresentar código; o CI falha em `format:check`.

<!-- /bmad:context -->

## Especificação

- Os ADRs só deste repositório ficam em `docs/adr/` (índice em `docs/adr/README.md`; leia o índice e abra o ADR só quando a tarefa tocar a regra dele). Os ADRs que valem para API e front (corporativos) ficam no repositório `sentinela-workspace`: `../docs/adr/` quando ele está ao lado, ou https://github.com/luasosi/sentinela-workspace/blob/master/docs/adr/README.md fora do workspace. Lá fica o próximo número livre; um ADR novo só deste repositório usa esse número.
- Épicos, PRDs e histórias ficam fora deste repositório, em `../docs/` (repositório `sentinela-workspace`). Cada área fica em `../docs/features/<area>/`, com `epico.md` (negócio) e `arquitetura.md` (técnico comum). Cada feature tem `F0N-nome/prd.md` (negócio), `F0N-nome/tech-spec.md` (requisitos com `arquivo:linha`, contrato, erros HTTP e camadas impactadas) e as histórias em `00-qa/` a `05-front/`. O padrão completo está na seção "Padrão de documentação" de `../AGENTS.md`. Exemplo: `../docs/features/artigos/`.
- Mudança de regra de negócio exige atualizar `../docs/` no mesmo dia.
