# Git History Cleanup — UUID vazado

`app/supabase_rls_migration.sql` continha um UUID real de usuário em commits anteriores. Arquivo atual usa placeholder, mas histórico ainda expõe.

## Limpar histórico (rodar localmente)

### Opção A — BFG
```bash
echo "a1d13768-7ff4-4bdb-b9d2-675cdc05e5c4==><SEU-UUID-AQUI>" > replace.txt
bfg --replace-text replace.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force origin main
rm replace.txt
```

### Opção B — git filter-repo
```bash
pip install git-filter-repo
git filter-repo --replace-text <(echo 'a1d13768-7ff4-4bdb-b9d2-675cdc05e5c4==><SEU-UUID-AQUI>')
git push --force origin main
```

Force push reescreve histórico — qualquer clone existente precisa reclonar.
