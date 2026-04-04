#!/usr/bin/env bash
# =============================================================================
# version.sh — Automação de Versionado Semântico
# Projeto: Contas a Pagar (Obsidian Ledger)
# =============================================================================
# Uso:
#   ./scripts/version.sh patch    # 1.0.0 → 1.0.1 (bugfix)
#   ./scripts/version.sh minor    # 1.0.0 → 1.1.0 (nova feature)
#   ./scripts/version.sh major    # 1.0.0 → 2.0.0 (breaking change)
#
# O script irá:
#   1. Validar o argumento e o ambiente (git, node, jq)
#   2. Calcular a nova versão via npm version
#   3. Atualizar lib/version.ts com a nova versão e data
#   4. Adicionar entrada no CHANGELOG.md
#   5. Criar git commit assinado
#   6. Criar git tag (ex: v1.0.1)
# =============================================================================

set -euo pipefail

# ─── Cores ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── Utilitários de log ──────────────────────────────────────
info()    { echo -e "${CYAN}ℹ  $*${RESET}"; }
success() { echo -e "${GREEN}✔  $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠  $*${RESET}"; }
error()   { echo -e "${RED}✖  $*${RESET}" >&2; exit 1; }

# ─── Banner ──────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║   Contas a Pagar — Version Manager       ║"
echo "║   Obsidian Ledger · Semantic Versioning  ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${RESET}"

# ─── Validação de argumento ──────────────────────────────────
BUMP_TYPE="${1:-}"

if [[ -z "$BUMP_TYPE" ]]; then
  error "Argumento obrigatório. Use: patch | minor | major"
fi

if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  error "Tipo inválido: '$BUMP_TYPE'. Use: patch | minor | major"
fi

# ─── Validação de dependências ───────────────────────────────
for cmd in git node npm; do
  command -v "$cmd" &>/dev/null || error "Comando '$cmd' não encontrado. Instale e tente novamente."
done

# ─── Verificar diretório do projeto ──────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"
info "Diretório do projeto: $PROJECT_ROOT"

# ─── Garantir repositório git limpo ──────────────────────────
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  error "Este diretório não é um repositório Git."
fi

DIRTY=$(git status --porcelain 2>/dev/null)
if [[ -n "$DIRTY" ]]; then
  warn "Existem mudanças não commitadas:"
  git status --short
  echo ""
  read -r -p "Deseja continuar mesmo assim? [s/N] " CONFIRM
  [[ "$CONFIRM" =~ ^[sS]$ ]] || error "Operação cancelada pelo usuário."
fi

# ─── Versão atual ────────────────────────────────────────────
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null)
info "Versão atual: ${BOLD}v${CURRENT_VERSION}${RESET}"

# ─── Calcular nova versão (sem criar tag ainda) ───────────────
info "Calculando nova versão ($BUMP_TYPE)..."
npm version "$BUMP_TYPE" --no-git-tag-version --silent

NEW_VERSION=$(node -p "require('./package.json').version" 2>/dev/null)
SUCCESS_MSG="v${CURRENT_VERSION} → v${NEW_VERSION}"

info "Nova versão: ${BOLD}v${NEW_VERSION}${RESET}"

# ─── Atualizar src/lib/version.ts ────────────────────────────────
VERSION_FILE="src/lib/version.ts"
BUILD_DATE=$(date +"%Y-%m-%d")

if [[ ! -f "$VERSION_FILE" ]]; then
  error "Arquivo $VERSION_FILE não encontrado. Crie-o antes de usar este script."
fi

info "Atualizando $VERSION_FILE..."

# Substitui a linha APP_VERSION (Comentado: agora dinâmico do package.json)
# if [[ "$(uname -s)" == "Darwin" ]]; then
#   # macOS (sed -i precisa de extensão)
#   sed -i '' "s/export const APP_VERSION = \".*\"/export const APP_VERSION = \"$NEW_VERSION\"/" "$VERSION_FILE"
#   sed -i '' "s/export const BUILD_DATE = new Date(\".*\")/export const BUILD_DATE = new Date(\"$BUILD_DATE\")/" "$VERSION_FILE"
# else
#   # Linux / WSL / Git Bash
#   sed -i "s/export const APP_VERSION = \".*\"/export const APP_VERSION = \"$NEW_VERSION\"/" "$VERSION_FILE"
#   sed -i "s/export const BUILD_DATE = new Date(\".*\")/export const BUILD_DATE = new Date(\"$BUILD_DATE\")/" "$VERSION_FILE"
# fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  # macOS (sed -i precisa de extensão)
  sed -i '' "s/export const BUILD_DATE = new Date(\".*\")/export const BUILD_DATE = new Date(\"$BUILD_DATE\")/" "$VERSION_FILE"
else
  # Linux / WSL / Git Bash
  sed -i "s/export const BUILD_DATE = new Date(\".*\")/export const BUILD_DATE = new Date(\"$BUILD_DATE\")/" "$VERSION_FILE"
fi

success "$VERSION_FILE atualizado."

# ─── Atualizar CHANGELOG.md ──────────────────────────────────
CHANGELOG="CHANGELOG.md"
TODAY=$(date +"%Y-%m-%d")

if [[ ! -f "$CHANGELOG" ]]; then
  warn "$CHANGELOG não encontrado. Criando estrutura básica..."
  cat > "$CHANGELOG" << EOF
# Changelog

## [Unreleased]

## [$NEW_VERSION] - $TODAY

### Changed
- Versão atualizada via script automático ($BUMP_TYPE bump)
EOF
else
  info "Adicionando entrada no $CHANGELOG..."

  # Determina a seção a adicionar baseada no tipo de bump
  if [[ "$BUMP_TYPE" == "major" ]]; then
    SECTION="### BREAKING CHANGES\n- TODO: Descreva a breaking change"
  elif [[ "$BUMP_TYPE" == "minor" ]]; then
    SECTION="### Added\n- TODO: Descreva a nova feature"
  else
    SECTION="### Fixed\n- TODO: Descreva o bugfix"
  fi

  # Insere nova entrada após o bloco [Unreleased]
  NEW_ENTRY="\n## [$NEW_VERSION] - $TODAY\n\n$SECTION\n"

  if [[ "$(uname -s)" == "Darwin" ]]; then
    sed -i '' "/## \[Unreleased\]/a\\
\\
$NEW_ENTRY" "$CHANGELOG"
  else
    # Insere após a linha [Unreleased] via awk (mais portável)
    awk -v entry="\n## [$NEW_VERSION] - $TODAY\n\n$SECTION\n" \
      '/## \[Unreleased\]/{print; print entry; next}1' \
      "$CHANGELOG" > "$CHANGELOG.tmp" && mv "$CHANGELOG.tmp" "$CHANGELOG"
  fi

  # Atualiza os links de comparação no final do arquivo
  REPO_URL="https://github.com/gabrieluranii/contas-a-pagar"
  if grep -q "\[Unreleased\]:" "$CHANGELOG"; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      sed -i '' "s|\[Unreleased\]: .*|[Unreleased]: $REPO_URL/compare/v$NEW_VERSION...HEAD|" "$CHANGELOG"
    else
      sed -i "s|\[Unreleased\]: .*|[Unreleased]: $REPO_URL/compare/v$NEW_VERSION...HEAD|" "$CHANGELOG"
    fi
    # Adiciona link da nova versão
    echo "[$NEW_VERSION]: $REPO_URL/compare/v$CURRENT_VERSION...v$NEW_VERSION" >> "$CHANGELOG"
  fi
fi

success "$CHANGELOG atualizado."

# ─── Git commit ──────────────────────────────────────────────
info "Criando git commit..."

git add package.json "$VERSION_FILE" "$CHANGELOG"

git commit -m "chore(release): bump version to v$NEW_VERSION

- Tipo de bump: $BUMP_TYPE
- Versão anterior: v$CURRENT_VERSION
- Nova versão: v$NEW_VERSION
- Data: $TODAY"

success "Commit criado."

# ─── Git tag ─────────────────────────────────────────────────
TAG_NAME="v$NEW_VERSION"
info "Criando tag $TAG_NAME..."

git tag -a "$TAG_NAME" -m "Release $TAG_NAME

Contas a Pagar — Obsidian Ledger
Tipo: $BUMP_TYPE bump
Data: $TODAY"

success "Tag $TAG_NAME criada."

# ─── Resumo final ────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}══════════════════════════════════════════${RESET}"
echo -e "${GREEN}  ✔ Versionado concluído com sucesso!${RESET}"
echo -e "${GREEN}  $SUCCESS_MSG${RESET}"
echo -e "${BOLD}${GREEN}══════════════════════════════════════════${RESET}"
echo ""
echo -e "  ${BOLD}Próximos passos:${RESET}"
echo -e "  ${CYAN}git push origin main --follow-tags${RESET}"
echo -e "  ${CYAN}# A Vercel fará deploy automático.${RESET}"
echo ""
