---
description: Safe multi-target Firebase deploy with confirmation gates
argument-hint: [target] [only-flags]
model: sonnet
---

Você está executando um deploy seguro para Firebase. Esse command é o ponto único de entrada para deploys — usa o wrapper `safe-deploy.sh` que tem prompts de confirmação.

## Passos

### 1. Coleta

Se o usuário não passou args inline, pergunte:

1. **Target**: `dev` (`adsmart-web-dev`) ou `prod` (`adsmart-web`)?
2. **O que deployar** (comma-separated, qualquer subset de): `rules`, `indexes`, `functions`, `hosting`?

### 2. Pré-condições (se inclui `rules`)

Verifique se `.firebase/rules-last-tested.txt` existe e é < 10 min. Se não:

> "Rules não testadas (ou stamp vencido). Vou rodar `/firestore-rules-test` antes."

Invoque `/firestore-rules-test`. Se falhar, **aborte** o deploy.

### 3. Pré-condições (se inclui `indexes`)

Mostre ao usuário o diff entre `firestore.indexes.json` local e o último deployado (use `firestore_list_indexes` MCP ou `firebase firestore:indexes --project ...`). Peça confirmação.

### 4. Confirmação prod

Se target = `prod`, mostre WARNING explícito antes de continuar:

> ⚠️  Você vai fazer deploy de [<list>] para PRODUÇÃO (adsmart-web). Confirma? (sim/não)

### 5. Execute

```bash
bash scripts/firebase/safe-deploy.sh <target> <only,only,only>
```

O wrapper:
- Pede prompt stdin "type 'prod' to confirm" se prod (extra layer).
- Bypassa o hook `rules-no-direct-deploy` via env var (já validamos).
- Roda `firebase deploy`.
- Polla index status até `Enabled` (5 min máx).

### 6. Reporte

Após sucesso:

- Lista o que foi deployado.
- Se inclui rules: mostra o resumo do `firestore.rules` aplicado.
- Se inclui indexes: confirma todos `Enabled`.
- Se inclui functions: lembra de monitorar logs (`firebase functions:log` ou MCP `functions_get_logs`).
- Adicione entry datada em `docs/CHANGES.md` se for prod.

### 7. Em caso de falha

- Mostre stderr completo.
- Sugira:
  - Se rules: invocar `firestore-rules-reviewer` agent.
  - Se indexes: verificar build status no Console; index pode estar `CREATING`.
  - Se functions: rodar `cd functions && bun run build` para ver erro local.

## Notas

- Nunca pular o wrapper. `firebase deploy --only firestore:rules` direto é bloqueado pelo hook `rules-no-direct-deploy` (a menos que `ADSMART_SAFE_DEPLOY=1` esteja setado, que só o wrapper seta).
- Para deploy de hosting estático sem nenhum dos outros: `bash scripts/firebase/safe-deploy.sh <target> hosting`.
- Para deploy completo: `bash scripts/firebase/safe-deploy.sh prod rules,indexes,functions,hosting` (warning: longo).

## Referências

- `scripts/firebase/safe-deploy.sh` (implementação)
- `docs/DEPLOYMENT.md`
- `firebase.json`, `.firebaserc`
