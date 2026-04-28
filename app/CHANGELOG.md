# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

## [1.9.4] - 2026-04-29

### Changed
- Modal TVO/Contingência: removido o campo "Produto" da UI. Coluna mantida no banco.

## [1.9.3] - 2026-04-29

### Changed
- Modal TVO/Contingência: removidos os campos "Centro de Custo" e "Origem" da UI. Colunas mantidas no banco para compat com import Excel.

## [1.9.2] - 2026-04-29

### Added
- Botão "+ Novo registro" em `/tvo` que abre o modal de lançamento TVO/Contingência.

## [1.9.1] - 2026-04-29

### Fixed
- Erro HTTP 401 ao extrair dados de NF/Boleto. Frontend agora envia o `access_token` da sessão Supabase via header `Authorization: Bearer ...`.
- Backend `/api/ocr` aceita token via header (browser usa localStorage) e mantém fallback de cookie-based para futura migração SSR.

## [1.9.0] - 2026-04-29

### Added
- Modal de lançamento TVO/Contingência em `/tvo/lista` agora aceita os campos `base`, `categoria` e `observação`.
- Toggle visual de tipo (TVO | Contingência) no topo do modal.
- Migration: 3 colunas novas em `tvo_registros` (base, cat, obs) com default `''`.
- Import Excel reconhece colunas "base", "categoria" e "observação".
- Coluna "Base" adicionada na listagem de registros TVO/Contingência.

## [1.8.1] - 2026-04-23

### Changed
- Janela mínima de lançamento ampliada de 7 para 10 dias antes do vencimento.
- Alerta vermelho de urgência ("URGENTE") agora aparece quando faltam 7 dias ou menos.
- Adicionada constante `URGENT_DAYS` em `lib/utils` para separar conceitos de "janela ideal" e "alerta crítico".
- Card "Próximos 7 dias" renomeado para "Próximos 10 dias".

## [1.8.0] - 2026-04-23

### Performance
- Anexos não são mais incluídos no carregamento inicial de bills/lançamentos.
  Reduz payload de ~8 MB para <100 KB e tempo de carregamento de 7s para <2s.
- Anexos passam a ser carregados sob demanda quando o modal de edição abre.

### Internal
- Adicionadas funções `fetchBillAttachments` e `fetchLancamentoAttachments` no AppContext.

## [1.7.3] - 2026-04-23

### Security
- C1: Removido UUID real de usuário do `supabase_rls_migration.sql` (substituído por placeholder). Ver `SECURITY_GIT_HISTORY_CLEANUP.md` para limpeza do histórico.
- C2: Rota `/api/ocr` agora exige sessão Supabase autenticada e aplica rate limit (20 req / 10 min por usuário). Mime type validado contra allowlist (pdf, jpeg, png, webp), tamanho máx 5 MB.
- C5: Signup público removido do `AuthGate`. Contas novas criadas manualmente via dashboard Supabase.

### Fixed
- C4: Criado `postcss.config.mjs` (estava ausente, quebrando build de produção).

## [1.3.9] - 2026-04-04

### Changed
- Substituição total dos diálogos nativos `window.confirm` por um componente `ConfirmModal` customizado com tema dark, animações e maior consistência visual no projeto.
- Melhoria no fluxo de exclusão (individual e em massa) com feedback visual integrado.

## [1.3.8] - 2026-04-04

### Added
- Redirecionamento automático para a página inicial (`/`) após login bem-sucedido no `AuthGate.jsx`.

### Fixed
- Melhoria no contraste e acessibilidade do `AlertBanner.jsx`, agora utilizando cores de alerta (`Amber 700`) mais legíveis com texto claro.

## [1.3.7] - 2026-04-04

### Changed
- Imagem de fundo personalizada aplicada à tela de login no `AuthGate.jsx`.

## [1.3.6] - 2026-04-03

### Fixed
- Conflito de arquivo `version.ts` duplicado resolvido (removido `app/lib/version.ts`).
- Script de versionamento (`version.sh`) atualizado para o novo caminho do arquivo de versão.

### Added
- Overlay de carregamento (Loading State) adicionado em `app/src/components/Providers.jsx`.

### Planejado
- Integração com Pix para pagamento direto
- Relatórios mensais exportáveis em PDF
- Notificações push para contas próximas do vencimento
- Dashboard de fluxo de caixa projetado (3 meses)
- Multi-empresa (switching de contexto)

---

## [1.0.0] - 2026-03-31

### BREAKING CHANGES

- **Redesign completo** da interface com o tema Obsidian Ledger
- **Nova paleta de cores**: verde primário `#2d5a3d`, fundo `#f5f3ee` (marfim)
- **Sidebar sempre visível** com largura fixa de 256px (antes: navbar superior)
- **Estrutura de dados migrada** para Next.js App Router (antes: single-file HTML)
- **Autenticação refatorada** para server-side com Supabase SSR

### Added

- Sistema de urgência com classificação automática (≤7 dias = urgente)
- Banner de alertas de contas vencidas e próximas ao vencimento
- Extração de dados via PDF com GPT-4o (upload e parsing automático)
- Rateio de contas entre centros de custo
- Suporte a TVO (Tomada de Valor Original) em reajustes
- Campo de contingência com percentual configurável
- Modal de edição inline com validação em tempo real
- Backup e restauração via arquivo JSON
- Indicador de status visual (paga / pendente / vencida / urgente)
- Filtros avançados por categoria, status, período e fornecedor
- Ordenação dinâmica em todas as colunas da tabela

### Changed

- Performance otimizada para listas com mais de 100 registros
- Tipografia migrada para sistema hierárquico com Inter + Geist Mono
- Animações suavizadas com `transition: all 0.2s ease`
- Layout responsivo aprimorado para tablet e mobile

### Fixed

- Bug crítico: `backdrop-filter` não funcionava em modais no Firefox 125+
- Inconsistência de opacidade em cards de resumo no dark mode
- Formatação de moeda `BRL` incorreta para valores negativos
- Scroll duplo em tabela + página no mobile

### Security

- Headers de segurança configurados via `next.config.ts`
- Variáveis de ambiente validadas no build com Zod
- Row Level Security (RLS) aplicada em todas as tabelas Supabase

---

## [0.1.0] - 2026-03-15

### Added

- MVP inicial funcional com gestão básica de contas
- Autenticação de usuário com Supabase Auth (e-mail + senha)
- CRUD completo de contas a pagar
- Categorias básicas (Fornecedor, Aluguel, Utilidades, Outros)
- Status de pagamento (paga / pendente)
- Deploy automatizado na Vercel via GitHub Actions
- Integração com Supabase Postgres como banco de dados

### Changed

- Migração do protótipo local para cloud (Supabase + Vercel)

---

## [0.0.1] - 2026-03-01

### Added

- Inicialização do projeto com `create-next-app`
- Configuração do repositório GitHub (`gabrieluranii/contas-a-pagar`)
- Setup de Tailwind CSS v4
- Setup de TypeScript estrito
- Arquivo `.env.local` com variáveis do Supabase
- Estrutura de pastas inicial (`app/`, `components/`, `lib/`)
- README.md com instruções de desenvolvimento local

---

[Unreleased]: https://github.com/gabrieluranii/contas-a-pagar/compare/v1.3.9...HEAD
[1.3.9]: https://github.com/gabrieluranii/contas-a-pagar/compare/v1.3.8...v1.3.9
[1.3.8]: https://github.com/gabrieluranii/contas-a-pagar/compare/v1.3.7...v1.3.8
[1.3.7]: https://github.com/gabrieluranii/contas-a-pagar/compare/v1.3.6...v1.3.7
[1.3.6]: https://github.com/gabrieluranii/contas-a-pagar/compare/v1.3.5...v1.3.6
[1.0.0]: https://github.com/gabrieluranii/contas-a-pagar/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/gabrieluranii/contas-a-pagar/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/gabrieluranii/contas-a-pagar/releases/tag/v0.0.1
