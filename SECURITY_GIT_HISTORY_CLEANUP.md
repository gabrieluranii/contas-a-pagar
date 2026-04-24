# Git History Cleanup — Remoção de UUID vazado

O arquivo `app/supabase_rls_migration.sql` continha um UUID real de usuário Supabase (`a1d13768-7ff4-4bdb-b9d2-675cdc05e5c4`) em commits anteriores. O arquivo atual já usa placeholder, mas o histórico ainda expõe o valor.

## Como limpar o histórico (rodar localmente, NÃO em CI)

### Opção A — BFG Repo-Cleaner (mais simples)

1. Instale o BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Na raiz do repo, crie um arquivo `replace.txt` com:
   ```
   a1d13768-7ff4-4bdb-b9d2-675cdc05e5c4==><SEU-UUID-AQUI>
   ```
3. Rode:
   ```bash
   bfg --replace-text replace.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force origin main
   ```
4. Apague `replace.txt` depois.

### Opção B — git filter-repo

```bash
pip install git-filter-repo
git filter-repo --replace-text <(echo 'a1d13768-7ff4-4bdb-b9d2-675cdc05e5c4==><SEU-UUID-AQUI>')
git push --force origin main
```

## Depois do force push

- Confirmar no GitHub (UI Code → History) que o UUID não aparece mais.
- Não é necessário rotacionar nada no Supabase — o UUID não é credencial, só identificador. Mas vale auditar logs de Auth nos últimos 30 dias por precaução.

## Aviso

Force push reescreve a história. Em repos pessoais sem colaboradores é seguro, mas qualquer clone local existente vai precisar reclonar.
