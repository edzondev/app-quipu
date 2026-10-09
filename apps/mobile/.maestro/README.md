# Maestro — Quipu (`com.quipu.finance`)

Flujos E2E de la app móvil. No se ejecutan en CI: no hay emulador ni APK en este cambio. Donde no hay `testID` se usa el texto visible o el `accessibilityLabel`.

Los flujos esperan las decisiones de Capi del 9 oct, no siempre el código de `d7bcb41`. Cada afirmación que hoy falla porque el arreglo todavía no está está marcada **espera arreglo pendiente** más abajo.

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

Flujos que piden ese pre-paso: `onboarding-paso-1`, `onboarding-ciclo`, `onboarding-despues`, `onboarding-saldo-cero`, `sueldo-cierra-ciclo`, `progreso-primer-cierre`.

Hasta que el #107 se mergee y Edzon ponga esas dos variables, los flujos de cuenta nueva están bloqueados.

`devSeed:seedVerifiedAccount` no crea perfil ni ciclo. Nato va a agregar dos semillas más (nombres por confirmar): una con perfil y **ningún ciclo en la vida de la cuenta**, y otra con ciclo activo. `QUIPU_E2E_NO_CYCLE_*` y `QUIPU_E2E_EMAIL` saldrán de esas dos. No uses una cuenta personal. Hace falta una tercera semilla para un ciclo ya vencido (`pastEnd`): la tarjeta «Tu ciclo del <inicio> al <fin> terminó.» queda pendiente de esa semilla.

## Variables

| Variable | Cuenta | Flujos |
|---|---|---|
| `QUIPU_E2E_EMAIL` | Semilla futura de ciclo **activo y sin vencer**, con varios días por delante, Fondo, menos de 6 metas y saldo. No es una cuenta personal | smoke, gastos, Extra, `sueldo-antes-del-fin`, plan, ajustes |
| `QUIPU_E2E_PASSWORD` | Contraseña de esa cuenta | los mismos |
| `QUIPU_E2E_FRESH_EMAIL` | El `email` pasado a `devSeed:seedVerifiedAccount` | asistente, Sueldo del primer ciclo, Progreso del primer cierre |
| `QUIPU_E2E_FRESH_PASSWORD` | El mismo valor que `DEV_SEED_PASSWORD` en el deployment dev. No va en el repo | los mismos |
| `QUIPU_E2E_NO_CYCLE_EMAIL` | Semilla futura: perfil completo y **nunca tuvo un ciclo**. No es «ciclo vencido» ni una cuenta personal | `home-vacio`, `sin-ciclo-solo-sueldo`; `home-primer-ingreso` una sola vez por cuenta |
| `QUIPU_E2E_NO_CYCLE_PASSWORD` | Contraseña | los mismos |

La contraseña incorrecta del flujo de entrar es el literal `clave-incorrecta`. No es una cuenta. Nada de esto va en los YAML.

`home-vacio` y `sin-ciclo-solo-sueldo` no guardan el ingreso. `home-primer-ingreso` registra S/ 3,000 y esa cuenta queda con ciclo.

## Espera arreglo pendiente

Estas afirmaciones describen la decisión de Capi. En `d7bcb41` todavía no pasan. Cuando llegue el PR del dueño, tienen que pasar.

| Afirmación | Dueño | Dónde |
|---|---|---|
| El paso 1 no muestra «DÍA DE PAGO», «El 1 de cada mes», «El 15 y 30 de cada mes», «Cada 7 días» ni «30 DÍAS» / «15 DÍAS» / «7 DÍAS» | Pixi, PR #106 | `onboarding-paso-1`, `onboarding-hasta-paso-4`, `onboarding-saldo-cero` |
| Mixto sin datos muestra «Indica la parte fija.» y «Agrega al menos una fuente.»; Variable muestra «Elige un ciclo de 15 o 30 días.» y «Agrega al menos una fuente.» | el validador no pinta el texto | `onboarding-paso-1` |
| El paso 5 no muestra monto diario («Puedes gastar hoy», `confirm-daily`, «Después de compromisos y ahorro, en N días.»). Inicio muestra `S/ 960.00` o `S/ 0.00` | Pixi, PR #106 | `onboarding-ciclo`, `onboarding-abrir-ciclo`, `onboarding-saldo-cero` |
| El primer ciclo no muestra «Saldo que quedó …» | Pixi, PR #106 | los mismos, en Inicio |
| La hoja de ingreso tiene «Sueldo» y «Extra». Sin ningún ciclo: solo Sueldo y «Tu sueldo empieza un ciclo nuevo» | Pixi, PR #106 | `registrar-ingreso`, `extra-no-cierra`, `sueldo-cierra-ciclo`, `sueldo-antes-del-fin`, `sin-ciclo-solo-sueldo`, `home-primer-ingreso` |
| Un Sueldo con cobro mañana cambia el rango de «CICLO» y el ciclo nuevo muestra «Saldo que quedó …». El selector es de Pixi; en `d7bcb41` ese ingreso ya cierra por la ventana de 2 días | Pixi | `sueldo-cierra-ciclo` |
| Un Sueldo varios días antes del fin cierra igual: no hay ventana de 2 días | Nubo | `sueldo-antes-del-fin` |
| Un Extra deja el mismo rango de «CICLO» (antes de « · N REGISTROS») | Nubo + Pixi | `extra-no-cierra` |
| Tras ese Sueldo, Progreso muestra «CICLOS CERRADOS EN VERDE» y «CICLO CERRADO · <MES>» | Nubo | `progreso-primer-cierre` |

Un ciclo vencido no se cierra solo. Inicio muestra la tarjeta que ya está en `home-closed-cycle.tsx`: «Tu ciclo del <inicio> al <fin> terminó.», «Te quedaron …» o «Te pasaste por …», «Tus movimientos siguen guardados.» y «Registrar nuevo ingreso». En la hoja (PR #106, `pastEnd`) siguen Gasto, Sueldo y Extra, con «Cierra este ciclo y empieza uno nuevo». No hay flujo: `devSeed:seedVerifiedAccount` no crea un ciclo con `pastEnd`, y no vamos a esperar a que venza. Esa tarjeta queda pendiente de una tercera semilla (ciclo ya vencido).

El servidor rechaza un Extra solo si la cuenta no tiene ningún ciclo. En la app no se llega a mandarlo. Es un caso de API (Notion `3f486a7356a6819786ecce6a1650094c`), sin texto exacto todavía. No se prueba en Maestro.

## Qué no está aquí

Passkeys, código de correo, sin internet, medianoche, rotación, accesibilidad, doble toque y elegir en el calendario un día que no sea mañana. El paso 2 deja la fecha que el picker trae (mañana) y solo toca «Continuar».

El atrás de Android en el asistente es manual (Capi: pasos 2 a 5 vuelven al paso anterior; el paso 1 vuelve a la Bienvenida). Los flujos solo usan la flecha de la app (`wizard-back`), que ya va al paso anterior.

«Cierre vacío» («Aún no hay un cierre.» / «Volver a Progreso») no tiene botón en Progreso vacío. No hay deep link en el flujo. Cerrar un ciclo esperando días, con la web o con un ingreso de fecha pasada sigue siendo manual. Cerrar el primer ciclo el mismo día con un Sueldo está en `sueldo-cierra-ciclo` y `progreso-primer-cierre`.

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
| `income-type-sueldo` | Hoja de ingreso | `apps/mobile/shared/components/income/income-sheet-form.tsx` (todavía no está) | «Sueldo» | `registrar-ingreso`, `sueldo-cierra-ciclo`, `sin-ciclo-solo-sueldo`, `progreso-primer-cierre` |
| `income-type-extra` | la misma | el mismo | «Extra» | `registrar-ingreso`, `extra-no-cierra` |
| `progress-closed-cycle` | Progreso | `apps/mobile/shared/components/progress/progress-screen.tsx` | «CICLO CERRADO · <MES>» | `progreso-primer-cierre` |
| `progress-closed-count` | Progreso | el mismo | «CICLOS CERRADOS EN VERDE» | `progreso-primer-cierre` |
