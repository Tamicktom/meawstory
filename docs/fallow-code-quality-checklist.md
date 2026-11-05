# Checklist de qualidade — Fallow

Relatório gerado com Fallow 2.26.1 em 2026-11-04, usando análise completa com score, duplicação, hotspots e alvos de refatoração.

## Resumo

- **Saúde geral:** 93,1/100 — nota A.
- **Código morto:** 3 tipos exportados sem uso.
- **Duplicação:** 6,31% das linhas analisadas; 29 grupos em 16 arquivos, todos de teste.
- **Complexidade:** nenhuma função acima dos limites de complexidade ciclomática 20 ou cognitiva 15.
- **Hotspots:** 26 arquivos com combinação de churn e complexidade relativa.
- **Risco CRAP:** 6 arquivos com score máximo igual ou superior a 30, usando cobertura estática estimada.
- **Sem achados:** arquivos sem uso, exports de valores sem uso no `dead-code`, dependências sem uso, imports não resolvidos, dependências não listadas, exports duplicados, dependências circulares e violações de boundary.

Os hotspots e scores CRAP representam riscos relativos, não defeitos confirmados. Os itens devem ser marcados como concluídos após correção ou após uma decisão explícita e justificada de mantê-los.

## 1. Tipos exportados sem uso

- [ ] **DC01 — Remover o `export` de `CriterionKind` ou documentar por que ele é API pública.** Local: `database/seed/render-rubric.ts:3`.
- [ ] **DC02 — Remover o `export` de `CriterionBands` ou documentar por que ele é API pública.** Local: `database/seed/render-rubric.ts:5`.
- [ ] **DC03 — Remover o `export` de `CriterionDefinition` ou documentar por que ele é API pública.** Local: `database/seed/render-rubric.ts:12`.

## 2. Grupos de duplicação

Antes de extrair helpers, confirmar que as ocorrências representam a mesma intenção e não apenas testes com estrutura semelhante.

- [ ] **DUP01 — `tests/components/editor.spec.ts`:** 12 linhas e 90 tokens repetidos em `:130-141`, `:193-204` e `:265-276`.
- [ ] **DUP02 — `tests/components/editor.spec.ts`:** 6 linhas e 54 tokens repetidos em `:135-140`, `:162-167`, `:198-203` e `:270-275`.
- [ ] **DUP03 — `tests/components/editor.spec.ts`:** 10 linhas e 60 tokens repetidos em `:251-260` e `:276-285`.
- [ ] **DUP04 — `tests/e2e/auth-query-cache.spec.ts:23-32` e `tests/e2e/sign-in.spec.ts:40-48`:** 10 linhas e 90 tokens repetidos.
- [ ] **DUP05 — `tests/e2e/auth-query-cache.spec.ts`:** 9 linhas e 56 tokens repetidos em `:27-35` e `:52-60`.
- [ ] **DUP06 — `tests/e2e/auth-query-cache.spec.ts:46-57` e `tests/e2e/sign-up.spec.ts:25-36`:** 12 linhas e 129 tokens repetidos.
- [ ] **DUP07 — `tests/e2e/dashboard-shell.spec.ts`:** 7 linhas e 58 tokens repetidos em `:11-17` e `:95-101`.
- [ ] **DUP08 — `tests/e2e/dashboard-shell.spec.ts`:** 12 linhas e 66 tokens repetidos em `:177-188` e `:191-202`.
- [ ] **DUP09 — `tests/unit/correction-service.test.ts`:** 19 linhas e 59 tokens repetidos em `:18-33` e `:68-86`.
- [ ] **DUP10 — `tests/unit/correction-status-route.test.ts:7-52` e `tests/unit/text-feedback-page.test.ts:15-62`:** 48 linhas e 174 tokens repetidos.
- [ ] **DUP11 — `tests/unit/correction-status-route.test.ts`:** 8 linhas e 51 tokens repetidos em `:99-106` e `:138-145`.
- [ ] **DUP12 — `tests/unit/correction-status-route.test.ts`:** 17 linhas e 59 tokens repetidos em `:113-125` e `:133-149`.
- [ ] **DUP13 — `tests/unit/correction-workflow.test.ts:26-42` e `tests/unit/lifetime-rules.test.ts:16-32`:** 17 linhas e 53 tokens repetidos.
- [ ] **DUP14 — `tests/unit/correction-workflow.test.ts:87-110` e `tests/unit/lifetime-rules.test.ts:43-66`:** 24 linhas e 82 tokens repetidos.
- [ ] **DUP15 — `tests/unit/correction-workflow.test.ts`:** 8 linhas e 61 tokens repetidos em `:210-217` e `:222-229`.
- [ ] **DUP16 — `tests/unit/correction-workflow.test.ts`:** 8 linhas e 59 tokens repetidos em `:247-254` e `:261-268`.
- [ ] **DUP17 — `tests/unit/correction-workflow.test.ts`:** 18 linhas e 97 tokens repetidos em `:362-378` e `:553-570`.
- [ ] **DUP18 — `tests/unit/correction-workflow.test.ts`:** 11 linhas e 69 tokens repetidos em `:388-398` e `:445-455`.
- [ ] **DUP19 — `tests/unit/correction-workflow.test.ts`:** 11 linhas e 69 tokens repetidos em `:421-431` e `:469-479`.
- [ ] **DUP20 — `tests/unit/lifetime-rules.test.ts:116-125` e `tests/unit/schema-constraints.test.ts:90-99`:** 10 linhas e 60 tokens repetidos.
- [ ] **DUP21 — `tests/unit/schema-constraints.test.ts`:** 5 linhas e 70 tokens repetidos em `:164-167` e `:187-191`.
- [ ] **DUP22 — `tests/unit/text-feedback-page.test.ts:13-53` e `tests/unit/texts-page.test.ts:9-49`:** 41 linhas e 185 tokens repetidos.
- [ ] **DUP23 — `tests/unit/text-feedback-page.test.ts:39-62` e `tests/unit/write-route.test.ts:49-76`:** 28 linhas e 69 tokens repetidos.
- [ ] **DUP24 — `tests/unit/text-feedback-page.test.ts`:** 9 linhas e 55 tokens repetidos em `:124-132` e `:189-197`.
- [ ] **DUP25 — `tests/unit/text-service.test.ts:174-184` e `tests/unit/texts-page.test.ts:111-122`:** 12 linhas e 77 tokens repetidos.
- [ ] **DUP26 — `tests/unit/text-service.test.ts:264-275` e `tests/unit/write-route.test.ts:114-125`:** 12 linhas e 50 tokens repetidos.
- [ ] **DUP27 — `tests/unit/texts-page.test.ts`:** 15 linhas e 81 tokens repetidos em `:142-156` e `:165-179`.
- [ ] **DUP28 — `tests/unit/theme-detail-page.test.ts:36-50` e `tests/unit/write-page.test.ts:50-64`:** 15 linhas e 79 tokens repetidos.
- [ ] **DUP29 — `tests/unit/write-route.test.ts`:** 14 linhas e 110 tokens repetidos em `:153-166` e `:171-184`.

## 3. Hotspots de manutenção

O score combina churn e complexidade relativa. Revisar cobertura e possíveis pontos de extração ao alterar cada arquivo; não refatorar apenas pelo score.

- [ ] **HOT01 — `app/(app)/dashboard/exercises/[themeId]/write/_components/editor.tsx`:** score 56,5; densidade 0,16; 7 commits; fan-in 3; tendência estável.
- [ ] **HOT02 — `workflows/correction.ts`:** score 50,0; densidade 0,11; 9 commits; fan-in 4; tendência estável.
- [ ] **HOT03 — `hooks/correction/use-check-correction-status.ts`:** score 34,0; densidade 0,22; 3 commits; fan-in 1; tendência esfriando.
- [ ] **HOT04 — `app/(app)/dashboard/themes/page.tsx`:** score 29,6; densidade 0,10; 6 commits; fan-in 2; tendência esfriando.
- [ ] **HOT05 — `tests/unit/sidebar-active-path.test.ts`:** score 27,9; densidade 0,18; 3 commits; fan-in 0; tendência esfriando.
- [ ] **HOT06 — `hooks/use-sign-in-form.ts`:** score 20,7; densidade 0,14; 3 commits; fan-in 1; tendência acelerando.
- [ ] **HOT07 — `hooks/use-sign-up-form.ts`:** score 20,7; densidade 0,14; 3 commits; fan-in 1; tendência acelerando.
- [ ] **HOT08 — `api/routes/write.ts`:** score 20,7; densidade 0,06; 7 commits; fan-in 1; tendência esfriando.
- [ ] **HOT09 — `hooks/write/use-write-text.ts`:** score 19,8; densidade 0,13; 3 commits; fan-in 1; tendência acelerando.
- [ ] **HOT10 — `components/feedback/feedback-view.tsx`:** score 15,2; densidade 0,10; 3 commits; fan-in 3; tendência acelerando.
- [ ] **HOT11 — `components/auth/sign-in-form.tsx`:** score 14,3; densidade 0,06; 5 commits; fan-in 2; tendência esfriando.
- [ ] **HOT12 — `tests/unit/text-service.test.ts`:** score 14,0; densidade 0,09; 3 commits; fan-in 0; tendência esfriando.
- [ ] **HOT13 — `services/correction.ts`:** score 13,7; densidade 0,09; 3 commits; fan-in 5; tendência acelerando.
- [ ] **HOT14 — `workflows/correction-grading.ts`:** score 13,5; densidade 0,09; 3 commits; fan-in 3; tendência esfriando.
- [ ] **HOT15 — `components/auth/sign-up-form.tsx`:** score 13,0; densidade 0,07; 4 commits; fan-in 2; tendência esfriando.
- [ ] **HOT16 — `app/(app)/dashboard/exercises/[themeId]/write/page.tsx`:** score 12,5; densidade 0,05; 5 commits; fan-in 1; tendência esfriando.
- [ ] **HOT17 — `database/seed/render-rubric.ts`:** score 12,2; densidade 0,08; 3 commits; fan-in 3; tendência acelerando.
- [ ] **HOT18 — `database/schema.ts`:** score 11,6; densidade 0,06; 4 commits; fan-in 21; tendência acelerando.
- [ ] **HOT19 — `api/index.ts`:** score 11,3; densidade 0,06; 4 commits; fan-in 5; tendência estável.
- [ ] **HOT20 — `app/(app)/dashboard/texts/[textId]/page.tsx`:** score 10,5; densidade 0,07; 3 commits; fan-in 1; tendência esfriando.
- [ ] **HOT21 — `components/app/sidebar.tsx`:** score 10,1; densidade 0,04; 5 commits; fan-in 1; tendência estável.
- [ ] **HOT22 — `app/page.tsx`:** score 6,6; densidade 0,05; 3 commits; fan-in 0; tendência acelerando.
- [ ] **HOT23 — `app/(app)/dashboard/themes/[id]/page.tsx`:** score 6,0; densidade 0,04; 3 commits; fan-in 1; tendência esfriando.
- [ ] **HOT24 — `app/(app)/dashboard/page.tsx`:** score 6,0; densidade 0,03; 4 commits; fan-in 1; tendência estável.
- [ ] **HOT25 — `components/ui/button/index.tsx`:** score 5,8; densidade 0,04; 3 commits; fan-in 8; tendência acelerando.
- [ ] **HOT26 — `app/layout.tsx`:** score 3,6; densidade 0,02; 4 commits; fan-in 0; tendência esfriando.

## 4. Alvos de refatoração em `components/ui`

O `health` recomenda remover estes exports, mas `.fallowrc.json` desativa `unused-exports` para `components/ui/**`. Por isso, o `dead-code` não os reporta. Confirmar se a superfície pública é intencional antes de remover qualquer item.

- [ ] **TGT01 — Revisar os 6 exports sem consumidores em `components/ui/field.tsx`.** Prioridade 25,0; esforço médio; 60% dos exports de valores sem uso: `FieldDescription`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent` e `FieldTitle`.
- [ ] **TGT02 — Revisar os 13 exports sem consumidores em `components/ui/sidebar.tsx`.** Prioridade 27,0; esforço alto; 54% dos exports de valores sem uso: `SidebarGroupAction`, `SidebarGroupLabel`, `SidebarInput`, `SidebarInset`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarRail`, `SidebarSeparator` e `useSidebar`.

## 5. Risco de complexidade sem cobertura — CRAP

A cobertura usada pelo Fallow é **estática e estimada**, não medida por um relatório de cobertura real. Confirmar a cobertura antes de tratar estes scores como dívida técnica.

- [ ] **CRAP01 — `components/ui/sidebar.tsx`:** CRAP máximo 72,0; 2 funções acima do limite. Relacionado a TGT02.
- [ ] **CRAP02 — `components/ui/field.tsx`:** CRAP máximo 56,0; 1 função acima do limite. Relacionado a TGT01.
- [ ] **CRAP03 — `components/providers/theme-provider.tsx`:** CRAP máximo 56,0; 2 funções acima do limite.
- [ ] **CRAP04 — `tests/helpers/schema-fixtures.ts`:** CRAP máximo 43,1; 2 funções acima do limite.
- [ ] **CRAP05 — `components/auth/field-errors.ts`:** CRAP máximo 42,0; 1 função acima do limite.
- [ ] **CRAP06 — `database/reset-dev-database.ts`:** CRAP máximo 42,0; 1 função acima do limite.

## 6. Validação após as correções

- [ ] Executar `fallow dead-code --format json --quiet` e confirmar que não restam achados inesperados.
- [ ] Executar `fallow dupes --format json --quiet` e revisar os grupos restantes.
- [ ] Executar `fallow health --format json --quiet --hotspots --targets` e comparar os scores.
- [ ] Executar `bun run typecheck`.
- [ ] Executar `bun run test` para validar as suítes unitárias e do Playwright.
