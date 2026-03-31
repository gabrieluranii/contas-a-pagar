# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

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

[Unreleased]: https://github.com/gabrieluranii/contas-a-pagar/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/gabrieluranii/contas-a-pagar/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/gabrieluranii/contas-a-pagar/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/gabrieluranii/contas-a-pagar/releases/tag/v0.0.1
