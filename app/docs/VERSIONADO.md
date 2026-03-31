# 📦 Guia de Versionado — Contas a Pagar

> **Versão atual**: `v1.0.0` · **Tema**: Obsidian Ledger · **Plataforma**: Vercel + GitHub

---

## Quick Start

```bash
# Bugfix (1.0.0 → 1.0.1)
bash scripts/version.sh patch

# Nova feature (1.0.0 → 1.1.0)
bash scripts/version.sh minor

# Breaking change (1.0.0 → 2.0.0)
bash scripts/version.sh major

# Depois: push com tags
git push origin main --follow-tags
```

---

## Semantic Versioning (SemVer)

O projeto segue o padrão [Semantic Versioning 2.0.0](https://semver.org/lang/pt-BR/).

```
MAJOR . MINOR . PATCH
  │       │       └─ Bugfixes, correções sem quebrar nada
  │       └───────── Novas features retrocompatíveis
  └───────────────── Mudanças que quebram compatibilidade
```

### Quando usar cada tipo

| Tipo    | Versão       | Quando usar |
|---------|-------------|-------------|
| `patch` | 1.0.0 → 1.0.1 | Correção de bug, ajuste de texto, fix de CSS |
| `minor` | 1.0.0 → 1.1.0 | Nova funcionalidade, novo componente, nova tela |
| `major` | 1.0.0 → 2.0.0 | Redesign completo, mudança de arquitetura, breaking change de API |

---

## Estrutura de Arquivos de Versionado

```
app/
├── package.json              ← Fonte oficial da versão (campo "version")
├── CHANGELOG.md              ← Histórico completo de mudanças
├── lib/
│   └── version.ts            ← Exporta APP_VERSION, getVersionInfo()
├── components/
│   └── VersionBadge.tsx      ← Componente React para exibir versão
├── scripts/
│   └── version.sh            ← Script bash de automação
└── docs/
    └── VERSIONADO.md         ← Esta documentação
```

---

## Fluxo de Atualização (Passo a Passo)

### 1. Desenvolver a mudança

```bash
# Crie uma branch para a feature/fix
git checkout -b feat/nova-funcionalidade

# Desenvolva normalmente...
git add .
git commit -m "feat: descrição da mudança"
```

### 2. Merge para main

```bash
git checkout main
git merge feat/nova-funcionalidade --no-ff
```

### 3. Executar o script de versionado

```bash
# Escolha o tipo adequado
bash scripts/version.sh minor
```

O script automaticamente:
- ✅ Atualiza `"version"` no `package.json`
- ✅ Atualiza `APP_VERSION` e `BUILD_DATE` em `lib/version.ts`
- ✅ Adiciona entrada em `CHANGELOG.md`
- ✅ Cria git commit com mensagem padronizada
- ✅ Cria git tag anotada (ex: `v1.1.0`)

### 4. Push para GitHub

```bash
git push origin main --follow-tags
```

A Vercel detecta o push e faz deploy automático.

---

## Editando o CHANGELOG.md Manualmente

Após rodar o script, edite a entrada gerada no `CHANGELOG.md` para descrever as mudanças reais:

```markdown
## [1.1.0] - 2026-04-15

### Added
- Relatório mensal exportável em PDF
- Filtro por fornecedor na listagem

### Fixed
- Ordenação incorreta ao alternar colunas
```

### Tipos de seção no CHANGELOG

| Seção | Uso |
|-------|-----|
| `### Added` | Novas funcionalidades |
| `### Changed` | Mudanças em funcionalidades existentes |
| `### Deprecated` | Funcionalidades que serão removidas |
| `### Removed` | Funcionalidades removidas |
| `### Fixed` | Correções de bugs |
| `### Security` | Correções de segurança |
| `### BREAKING CHANGES` | Mudanças que quebram compatibilidade |

---

## Usando o Componente VersionBadge

### Modo completo (footer, página "Sobre")

```tsx
import VersionBadge from "@/components/VersionBadge";

<VersionBadge />
```

### Modo compacto (sidebar, header)

```tsx
<VersionBadge compact />
```

### Com classe personalizada

```tsx
<VersionBadge className="mt-4 self-end" />
```

---

## Usando lib/version.ts

```typescript
import {
  APP_VERSION,
  APP_NAME,
  BUILD_DATE,
  THEME,
  VERSION_TAG,
  ENVIRONMENT,
  getVersionInfo,
} from "@/lib/version";

// Uso básico
console.log(APP_VERSION); // "1.0.0"
console.log(VERSION_TAG); // "v1.0.0"

// Objeto completo
const info = getVersionInfo();
console.log(info.buildDateFormatted); // "31/03/2026"
console.log(info.isDev);              // false (em produção)
```

---

## Integração com Vercel

A Vercel cria uma URL de preview para cada branch e faz deploy de produção em cada push para `main`.

### Variáveis de ambiente sugeridas

Adicione no painel Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production
```

Após adicionar, acesse no componente:

```typescript
process.env.NEXT_PUBLIC_APP_VERSION // "1.0.0"
```

### GitHub Actions (opcional)

Crie `.github/workflows/release.yml` para automação completa:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy para Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## FAQ

**P: Posso usar `npm version patch` diretamente?**
R: Sim, mas o script `version.sh` também atualiza `lib/version.ts` e o CHANGELOG automaticamente. Recomendamos usar o script.

**P: A tag git é obrigatória?**
R: Não é obrigatória para o deploy, mas é essencial para rastreabilidade e comparações no CHANGELOG.

**P: Como reverter um bump de versão?**
R: `git revert HEAD` desfaz o commit, mas você precisará deletar a tag manualmente: `git tag -d v1.0.1 && git push origin :refs/tags/v1.0.1`.

**P: Posso ter duas versões ao mesmo tempo (ex: 1.x e 2.x)?**
R: Sim. Crie branches de suporte: `git checkout -b support/1.x v1.0.0`.

**P: O script funciona no Windows?**
R: Sim, via Git Bash ou WSL. No PowerShell puro pode haver incompatibilidades com `sed`.

---

## Histórico de Versões

Consulte o [CHANGELOG.md](../CHANGELOG.md) para o histórico completo.

| Versão | Data       | Tipo         | Destaque |
|--------|-----------|--------------|----------|
| 1.0.0  | 2026-03-31 | Major release | Obsidian Ledger redesign |
| 0.1.0  | 2026-03-15 | Minor        | MVP com Supabase + Vercel |
| 0.0.1  | 2026-03-01 | Init         | Inicialização do projeto |
