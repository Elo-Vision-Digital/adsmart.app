---
description: Run Firestore rules unit tests in the emulator and stamp the result
model: sonnet
---

Você está rodando os testes unitários das regras Firestore antes de um deploy. Esse command é a pré-condição para `/firebase-deploy` quando o deploy inclui `rules`.

## Passos

1. **Verifique pré-condições**:
   - Existe arquivo `functions/test/firestore-rules*.test.ts`? Se não, peça ao usuário para criar antes.
   - `@firebase/rules-unit-testing` está em `functions/package.json` devDependencies? Se não, sugira `cd functions && bun add -d @firebase/rules-unit-testing`.

2. **Rode o script wrapper**:

```bash
bash scripts/firebase/test-rules.sh
```

Esse script roda `firebase emulators:exec --only firestore --project demo-adsmart "cd functions && bunx vitest run firestore-rules"` e, em sucesso, stampa `.firebase/rules-last-tested.txt`.

3. **Reporte ao usuário**:
   - Se PASS: confirmar quantos testes passaram + timestamp do stamp.
   - Se FAIL: mostrar os testes que falharam + sugerir invocar o agent `firestore-rules-reviewer` para diagnóstico.
   - Bloquear deploy se FAIL.

## Notas

- O stamp em `.firebase/rules-last-tested.txt` é consumido pelo hook `rules-no-direct-deploy` e pelo `safe-deploy.sh`. Stamp expira em 10 minutos — re-rode se o deploy não acontecer rapidamente após o teste.
- Stamp está em `.gitignore` (é local-only).
- Para rodar em watch durante desenvolvimento: `cd functions && bun run test:watch -- firestore-rules`. Esse modo NÃO stampa — use o command para o stamp.

## Referências

- `scripts/firebase/test-rules.sh` (implementação)
- `functions/test/firestore-rules.test.ts` (test suite)
- `firestore.rules` (sob teste)
- Firebase docs: test-rules-emulator
