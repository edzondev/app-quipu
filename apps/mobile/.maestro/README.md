# Maestro — Quipu (`com.quipu.finance`)

Flujos E2E de la app móvil. No se ejecutan en CI: no hay emulador ni APK en este cambio. Donde no hay `testID` se usa el texto visible o el `accessibilityLabel`.

Los flujos esperan las decisiones de Capi del 9 oct sobre `e54ad3d` (PR #105). Pixi todavía no puso en la app el selector «¿Empieza un nuevo ciclo?» / «Sumar al ciclo actual»: esos flujos están en **espera arreglo pendiente**.

## Cómo correrlos

Desde `apps/mobile`, con el APK ya instalado:

```bash
maestro test --include-tags=smoke .maestro/
```

Ese es el script `pnpm maestro:smoke`. `smoke` es la corrida repetible con la cuenta de datos: bienvenida, entrar, Inicio, un gasto en la hoja y Movimientos.

Otras corridas:

```bash
maestro test --include-tags=onboarding .maestro/
maestro test --include-tags=no-cycle .maestro/
maestro test flows/home-primer-ingreso.yaml
maestro test flows/onboarding-ciclo.yaml
```

`config.yaml` lista solo `flows/`. `subflows/` no se corre solo.

Pasa las variables en el entorno o con `-e` (nunca en el YAML):

```bash
maestro test --include-tags=smoke .maestro/ \
  -e QUIPU_E2E_EMAIL=... \
  -e QUIPU_E2E_PASSWORD=...
```

## APK `preview` y Convex dev

El APK tiene que ser el build EAS **preview** (`apps/mobile/eas.json`, perfil `preview`), no `production`.

`development` y `preview` apuntan al Convex de desarrollo **`perceptive-elk-229`**:

- `https://perceptive-elk-229.convex.cloud`
- `https://perceptive-elk-229.convex.site`

Producción es `patient-chihuahua-640`. No instales ese APK para estas pruebas: los flujos escriben gastos, metas y el primer ciclo.

`launchApp.clearState` solo borra los datos locales de `com.quipu.finance` para entrar con la cuenta del env. No es `resetAll` y no toca Convex.

## Pre-paso: cuenta nueva (Nato, PR #107, sin merge)

Función interna `devSeed:seedVerifiedAccount`. Solo corre en Convex dev `perceptive-elk-229` si Edzon dejó `ALLOW_DEV_SEED=true` y `DEV_SEED_PASSWORD` en ese deployment. Producción (`patient-chihuahua-640`) no tiene el flag y además rechaza el host. No uses `--prod`. No uses `resetAll`.

Desde `apps/web`, con el CLI apuntando a ese dev:

```bash
EMAIL="maestro-$(date +%s)@example.com"
npx convex run devSeed:seedVerifiedAccount "{\"email\":\"$EMAIL\"}"
export QUIPU_E2E_FRESH_EMAIL="$EMAIL"
export QUIPU_E2E_FRESH_PASSWORD="$DEV_SEED_PASSWORD"
```

`DEV_SEED_PASSWORD` es el mismo secreto del deployment. La función no lo devuelve. Devuelve `{ email, userId, emailVerified: true, hasProfile: false }`. La cuenta entra al asistente. Un correo repetido tira «Ya existe una cuenta con ese correo.»: un email nuevo por corrida.

Flujos que piden ese pre-paso: `onboarding-paso-1`, `onboarding-ciclo`, `onboarding-despues`, `onboarding-saldo-cero`, `mismo-dia-solo-sumar`, `sumar-no-cierra`, `progreso-vacio`.

Hasta que el #107 se mergee y Edzon ponga esas dos variables, los flujos de cuenta nueva están bloqueados.

`devSeed:seedVerifiedAccount` no crea perfil ni ciclo. Nato va a agregar dos semillas más (nombres por confirmar): una con perfil y **ningún ciclo en la vida de la cuenta**, y otra con ciclo activo. `QUIPU_E2E_NO_CYCLE_*` y `QUIPU_E2E_EMAIL` saldrán de esas dos. No uses una cuenta personal.

Hacen falta tres semillas más, nombres por confirmar, nunca una cuenta personal:

- Ciclo que **empezó antes de hoy** y todavía no vence, una cuenta nueva por corrida: `QUIPU_E2E_PRIOR_CYCLE_*`. La usan `registrar-ingreso` (tiene que ver las dos opciones) y `ciclo-nuevo-antes-del-fin` (además le tienen que quedar varios días). Una semilla de hoy no sirve.
- Ciclo de **apertura empezado antes de hoy**: `QUIPU_E2E_OPENING_PRIOR_*`. `progreso-primer-cierre` está bloqueado hasta esa semilla.
- Ciclo ya vencido (`pastEnd`): `QUIPU_E2E_EXPIRED_*`. El flujo `ciclo-vencido` no está escrito. Cuando exista va a mirar la tarjeta, un gasto, «Sumar al ciclo actual» y «¿Empieza un nuevo ciclo?» (Notion `3f486a7356a6816691daf0877414cf26`).

## Variables

| Variable | Cuenta | Flujos |
|---|---|---|
| `QUIPU_E2E_EMAIL` | Semilla futura de ciclo **activo y sin vencer**, con Fondo, menos de 6 metas y saldo. No es una cuenta personal. No la uses en flujos que registran un ingreso | smoke, gastos, plan, ajustes |
| `QUIPU_E2E_PASSWORD` | Contraseña de esa cuenta | los mismos |
| `QUIPU_E2E_FRESH_EMAIL` | El `email` pasado a `devSeed:seedVerifiedAccount`, uno nuevo por corrida | asistente, `mismo-dia-solo-sumar`, `sumar-no-cierra`, `progreso-vacio` |
| `QUIPU_E2E_FRESH_PASSWORD` | El mismo valor que `DEV_SEED_PASSWORD` en el deployment dev. No va en el repo | los mismos |
| `QUIPU_E2E_NO_CYCLE_EMAIL` | Semilla futura: perfil completo y **nunca tuvo un ciclo**. No es «ciclo vencido» ni una cuenta personal | `home-vacio`, `sin-ciclo-solo-ciclo-nuevo`; `home-primer-ingreso` una sola vez por cuenta |
| `QUIPU_E2E_NO_CYCLE_PASSWORD` | Contraseña | los mismos |
| `QUIPU_E2E_PRIOR_CYCLE_EMAIL` | Semilla futura, una cuenta nueva por corrida: ciclo activo que **empezó antes de hoy** | `registrar-ingreso`, `ciclo-nuevo-antes-del-fin` |
| `QUIPU_E2E_PRIOR_CYCLE_PASSWORD` | Contraseña | los mismos |
| `QUIPU_E2E_OPENING_PRIOR_EMAIL` | Semilla futura: ciclo de **apertura empezado antes de hoy**. Todavía no existe | `progreso-primer-cierre` (bloqueado) |
| `QUIPU_E2E_OPENING_PRIOR_PASSWORD` | Contraseña | el mismo |
| `QUIPU_E2E_EXPIRED_EMAIL` | Semilla futura: ciclo ya vencido. Nombre por confirmar | `ciclo-vencido` (sin escribir) |
| `QUIPU_E2E_EXPIRED_PASSWORD` | Contraseña | el mismo |

La contraseña incorrecta del flujo de entrar es el literal `clave-incorrecta`. No es una cuenta. Nada de esto va en los YAML.

`home-vacio` y `sin-ciclo-solo-ciclo-nuevo` no guardan el ingreso. `home-primer-ingreso` registra S/ 3,000 y esa cuenta queda con ciclo.

Nombres viejos, de cuando la hoja decía «Sueldo» y «Extra»: `sueldo-cierra-ciclo` es `mismo-dia-solo-sumar`, `sueldo-antes-del-fin` es `ciclo-nuevo-antes-del-fin`, `extra-no-cierra` es `sumar-no-cierra`, `sin-ciclo-solo-sueldo` es `sin-ciclo-solo-ciclo-nuevo`.

La hoja pregunta «¿Empieza un nuevo ciclo?» o «Sumar al ciclo actual». El `?` va escapado en el selector: `"¿Empieza un nuevo ciclo\\?"`. Si el ciclo empezó hoy, solo se puede sumar.

## Espera arreglo pendiente

Estas afirmaciones describen la decisión de Capi. En `e54ad3d` todavía no pasan. Cuando llegue el PR del dueño, tienen que pasar.

| Afirmación | Dueño | Dónde |
|---|---|---|
| El paso 1 no muestra «DÍA DE PAGO», «El 1 de cada mes», «El 15 y 30 de cada mes», «Cada 7 días» ni «30 DÍAS» / «15 DÍAS» / «7 DÍAS» | Pixi, PR #106 | `onboarding-paso-1`, `onboarding-hasta-paso-4`, `onboarding-saldo-cero` |
| Mixto sin datos muestra «Indica la parte fija.» y «Agrega al menos una fuente.»; Variable muestra «Elige un ciclo de 15 o 30 días.» y «Agrega al menos una fuente.» | el validador no pinta el texto | `onboarding-paso-1` |
| El paso 5 no muestra monto diario («Puedes gastar hoy», `confirm-daily`, «Después de compromisos y ahorro, en N días.»). Inicio muestra `S/ 960.00` o `S/ 0.00` | Pixi, PR #106 | `onboarding-ciclo`, `onboarding-abrir-ciclo`, `onboarding-saldo-cero` |
| El primer ciclo no muestra «Saldo que quedó …» | Pixi, PR #106 | los mismos, en Inicio |
| La hoja pregunta «¿Empieza un nuevo ciclo?» y «Sumar al ciclo actual». En `e54ad3d` no está: todo ingreso se manda como habitual | Pixi | `registrar-ingreso`, `sumar-no-cierra`, `ciclo-nuevo-antes-del-fin`, `sin-ciclo-solo-ciclo-nuevo`, `home-primer-ingreso`, `mismo-dia-solo-sumar`, `progreso-primer-cierre` |
| Un ciclo que empezó hoy solo acepta «Sumar al ciclo actual» | Pixi + Nubo | `mismo-dia-solo-sumar` |
| La etiqueta de la fila del ingreso en Movimientos | Pixi | `home-primer-ingreso` (no se afirma) |
| La racha ignora un ciclo de menos de un día (Notion `3f486a7356a68157a6e5df4e560dfd46`). En `e54ad3d` solo se salta el ciclo de apertura | Nubo | ningún flujo: haría falta cerrar dos veces el mismo día |

Un ciclo vencido no se cierra solo. Inicio muestra la tarjeta que ya está en `home-closed-cycle.tsx`: «Tu ciclo del <inicio> al <fin> terminó.», «Te quedaron …» o «Te pasaste por …», «Tus movimientos siguen guardados.» y «Registrar nuevo ingreso». Sigue activo hasta «¿Empieza un nuevo ciclo?». «Sumar al ciclo actual» se queda en ese ciclo. El flujo `ciclo-vencido` espera `QUIPU_E2E_EXPIRED_*`.

Cerrar el ciclo de apertura lo anota en el historial de Progreso y no mueve la racha. `progreso-primer-cierre` no afirma el número. Está bloqueado hasta `QUIPU_E2E_OPENING_PRIOR_*`.

La hoja no tiene calendario. «Fecha» muestra «Hoy · …» y no se puede cambiar. Son casos de API y de la web de desarrollo, sin flujo de Maestro:

- Fecha futura, un día de Lima después de hoy (más tarde hoy vale): «La fecha del ingreso no puede ser futura.» Notion `3f486a7356a681f5ad2dc25bcda0499c`.
- «Sumar al ciclo actual» con fecha anterior al inicio: «La fecha del ingreso no puede ser anterior al inicio del ciclo.» Notion `3f486a7356a6814bb142d69eff7f1558`.
- Sumar sin ningún ciclo: «Registra primero tu sueldo para empezar un ciclo nuevo.» Notion `3f486a7356a6819786ecce6a1650094c`.

Cuál opción viene marcada según la fecha no está en `e54ad3d`. Estos flujos no lo afirman.

## Qué no está aquí

Passkeys, código de correo, sin internet, medianoche, rotación, accesibilidad, doble toque y elegir en el calendario un día que no sea mañana. El paso 2 deja la fecha que el picker trae (mañana) y solo toca «Continuar».

El atrás de Android en el asistente es manual (Capi: pasos 2 a 5 vuelven al paso anterior; el paso 1 vuelve a la Bienvenida). Los flujos solo usan la flecha de la app (`wizard-back`), que ya va al paso anterior.

«Cierre vacío» («Aún no hay un cierre.» / «Volver a Progreso») no tiene botón en Progreso vacío. No hay deep link en el flujo. Cerrar un ciclo esperando días, con la web o con una fecha que el teléfono no deja elegir sigue siendo manual. El mismo día en que el ciclo empieza solo se puede sumar (`mismo-dia-solo-sumar`). Cerrar el ciclo de apertura en un día posterior está en `progreso-primer-cierre`, bloqueado, y no suma racha.

## testID que faltan

Hoy el `id` de Maestro solo existe en el asistente (`option-*`, `amount-input`, `opening-balance-input`, `pay-date-picker`, `allocation-*`, `chip-*`, `commitment-*`, `confirm-*`, `wizard-back`, `wizard-progress-N`) y en `tabs-top-inset`. El resto de estos flujos usa texto. Conviene agregar:

| testID propuesto | Pantalla | Archivo | Elemento | Flujo |
|---|---|---|---|---|
| `welcome-create-account` | Bienvenida | `modules/onboarding/components/welcome.tsx` | «Crear cuenta» | `welcome` |
| `welcome-sign-in` | Bienvenida | el mismo | «Ya tengo cuenta» | `welcome` |
| `welcome-example-amount` | Bienvenida | el mismo | `S/ 42.30` | `welcome` |
| `sign-in-email-method` | Entrar | `app/(auth)/sign-in.tsx` | «Entrar con correo» | `sign-in` |
| `sign-in-email` | Entrar | `shared/components/auth/auth-labeled-field.tsx` | campo Correo | `sign-in` |
| `sign-in-password` | Entrar | el mismo | campo Contraseña | `sign-in` |
| `sign-in-submit` | Entrar | `shared/components/auth/auth-button.tsx` | «Entrar» | `sign-in` |
| `wizard-continue` | Asistente, pasos 1–4 | cada paso (`step-1-income-profile.tsx`, `step-pay-date.tsx`, `step-3-allocation.tsx`, `step-4-commitments.tsx`) | «Continuar» | onboarding |
| `wizard-start` | Paso 5 | `modules/onboarding/components/step-confirm.tsx` | «Empezar mi ciclo» | `onboarding-ciclo`, `onboarding-despues` |
| `field-error-mixed` | Paso 1 | `step-1-income-profile.tsx` | el validador no pinta «Indica la parte fija.» | `onboarding-paso-1` |
| `field-error-sources` | Paso 1 | el mismo | «Agrega al menos una fuente.» | `onboarding-paso-1` |
| `field-error-cycle` | Paso 1 | el mismo | «Elige un ciclo de 15 o 30 días.» | `onboarding-paso-1` |
| `home-daily` | Inicio | `shared/components/home/home-dense.tsx` | monto «Hoy puedes gastar» (`S/ 960.00` o `S/ 0.00`) | `onboarding-ciclo`, `onboarding-abrir-ciclo`, `onboarding-saldo-cero` |
| `home-cycle-day` | Inicio | el mismo | «Día X/Y» | `home-ciclo` |
| `home-envelope-needs` | Inicio | el mismo | fila Necesidades | `home-ciclo` |
| `home-envelope-wants` | Inicio | el mismo | fila Gustos | `home-ciclo` |
| `home-envelope-savings` | Inicio | el mismo | fila Ahorro | `home-ciclo` |
| `home-carry` | Inicio | el mismo | «Saldo que quedó…» (solo si hay arrastre) | ninguno todavía: el primer ciclo lo deja en 0 |
| `home-add-income` | Inicio | `shared/components/home/home-identity.tsx` | «+ Ingreso» | `home-ciclo` |
| `home-view-movements` | Inicio | `home-dense.tsx` | «Ver todos» | `home-ciclo` |
| `home-register-income` | Inicio vacío | `shared/components/home/home-empty.tsx` | «Registrar ingreso» | `home-vacio`, `home-primer-ingreso` |
| `registrar-mode-expense` | Hoja | `shared/components/navigation/registrar-sheet.tsx` | «Gasto» | registrar, `home-vacio` |
| `registrar-mode-income` | Hoja | el mismo | «Ingreso» | registrar, `home-vacio` |
| `registrar-fab` | Tab | `shared/components/navigation/registrar-tab-button.tsx` | botón central | registrar |
| `keypad-0` … `keypad-9`, `keypad-backspace` | Teclado | `shared/components/expenses/expense-keypad.tsx` | teclas | registrar |
| `expense-submit` | Hoja de gasto | `shared/components/expenses/expense-sheet-form.tsx` | «Registrar gasto» | `registrar-gasto-hoja` |
| `envelope-needs` | Sobres del gasto | `shared/components/expenses/envelope-choices.tsx` | «Necesidades» | registrar, compromisos |
| `envelope-wants` | el mismo | el mismo | «Gustos» | registrar |
| `income-submit` | Hoja de ingreso | `shared/components/income/income-sheet-form.tsx` | «Registrar ingreso» | `registrar-ingreso` |
| `expense-amount` | Pantalla completa | `shared/components/expenses/expense-detail-form.tsx` | campo Monto | `registrar-gasto-completo`, editar |
| `expense-save` | la misma | el mismo | «Guardar» / «Registrar gasto» | editar, completo |
| `expense-delete` | la misma | el mismo | «Eliminar» | `movimientos-editar-eliminar` |
| `movement-filter-all` | Movimientos | `shared/components/movements/movements-list.tsx` | «Todos» | `movimientos` |
| `movement-filter-needs` | la misma | el mismo | «Necesidades» | `movimientos` |
| `movement-filter-wants` | la misma | el mismo | «Gustos» | `movimientos` |
| `movement-filter-savings` | la misma | el mismo | «Ahorro» | `movimientos` |
| `movement-row` | la misma | el mismo | fila (hoy el label es «comercio, monto») | editar |
| `commitment-submit` | Hoja de compromiso | `shared/components/commitments/commitment-form.tsx` | «Agregar compromiso» | `compromisos` |
| `goal-submit` | Hoja de meta | `shared/components/savings/goal-form.tsx` | «Crear meta» | `ahorro-metas` |
| `savings-fund` | Ahorro | `shared/components/savings/savings-screen.tsx` | tarjeta del Fondo | `ahorro-metas` |
| `plan-row-sobres` | Plan | `shared/components/plan/plan-hub.tsx` | fila Sobres | `plan-sobres` |
| `sobres-needs` | Sobres | `shared/components/envelopes/sobres-screen.tsx` | bloque Necesidades | `plan-sobres` |
| `sobres-wants` | la misma | el mismo | Gustos, incluido «Va rápido» | `plan-sobres` |
| `sobres-savings` | la misma | el mismo | Ahorro | `plan-sobres` |
| `settings-name` | Ajustes | `shared/components/settings/settings-screen.tsx` | nombre | `ajustes-cerrar-sesion` |
| `settings-meta` | la misma | el mismo | «correo · país» | `ajustes-cerrar-sesion` |
| `tab-inicio` | Tabs | `app/(tabs)/_layout.tsx` | pestaña Inicio | varios |
| `tab-movimientos` | la misma | el mismo | Movimientos | varios |
| `tab-plan` | la misma | el mismo | Plan | varios |
| `tab-progreso` | la misma | el mismo | Progreso | `progreso-vacio`, `progreso-primer-cierre` |
| `income-mode-new-cycle` | Hoja de ingreso | `apps/mobile/shared/components/income/income-sheet-form.tsx` (Pixi, todavía no está) | «¿Empieza un nuevo ciclo?» | `registrar-ingreso`, `ciclo-nuevo-antes-del-fin`, `sin-ciclo-solo-ciclo-nuevo`, `progreso-primer-cierre`, `home-primer-ingreso` |
| `income-mode-add` | la misma | el mismo | «Sumar al ciclo actual» | `registrar-ingreso`, `sumar-no-cierra`, `mismo-dia-solo-sumar` |
| `progress-closed-cycle` | Progreso | `apps/mobile/shared/components/progress/progress-screen.tsx` | «CICLO CERRADO · <MES>» | `progreso-primer-cierre` |
| `progress-closed-count` | Progreso | el mismo | «CICLOS CERRADOS EN VERDE» | `progreso-primer-cierre` |
