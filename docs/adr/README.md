# ADRs do front

Decisões que valem só para o front. As que valem para API e front (autenticação, formato de erro, contrato HTTP, build, testes, execução) ficam no repositório `sentinela-workspace`, em [`docs/adr/`](https://github.com/luasosi/sentinela-workspace/blob/master/docs/adr/README.md), que também guarda o **próximo número livre** (a numeração é única no sistema).

Leia só este índice; abra um ADR quando ele for citado ou quando a tarefa tocar a regra dele.

| ADR                                                         | Decisão                                     | Status              | Regra principal para quem constrói                                                        |
| ----------------------------------------------------------- | ------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| [ADR-010](ADR-010-front-angular-standalone-por-feature.md)  | Front standalone em core, features e shared | aceita (retroativa) | Tela em `features/<area>/pages/`, service em `features/<area>/services/`                  |
| [ADR-011](ADR-011-integracao-front-api-por-interceptors.md) | Integração por interceptors                 | aceita (retroativa) | Service usa URL relativa e não define cabeçalho; porta muda junto com `api/subir-api.ps1` |
