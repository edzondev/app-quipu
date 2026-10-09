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

## Pre-paso: cuenta nueva (Nato)

Nato va a agregar una función interna de Convex, solo de desarrollo, que crea una cuenta verificada y **sin perfil**. El nombre y los argumentos todavía no existen (`d7bcb41`). Placeholder:

```bash
# Solo contra perceptive-elk-229. Nunca patient-chihuahua-640. Nunca resetAll.
export QUIPU_E2E_SEED_FN="<fn>"   # TBD, por confirmar con Nato
npx convex run "$QUIPU_E2E_SEED_FN"
```

Ese comando se corre **antes de cada flujo** que usa `QUIPU_E2E_FRESH_EMAIL` y `QUIPU_E2E_FRESH_PASSWORD`, y tiene que dejar esas dos variables en el entorno (el mecanismo exacto depende de la firma de la función). Así cada corrida del asistente abre su primer ciclo en una cuenta nueva. No hace falta una cuenta «one-shot» aparte ni `QUIPU_E2E_FRESH_SKIP_*`.

Flujos que piden ese pre-paso: `onboarding-paso-1`, `onboarding-ciclo`, `onboarding-despues`, `onboarding-saldo-cero`, `sueldo-cierra-ciclo`, `progreso-primer-cierre`.

La función, tal como está descrita, no crea una cuenta con perfil y sin ciclo. `home-vacio`, `home-primer-ingreso` y `sin-ciclo-solo-sueldo` siguen usando `QUIPU_E2E_NO_CYCLE_*`. Si Nato agrega un modo para eso, el mismo pre-paso puede exportar esas variables y `home-primer-ingreso` deja de gastarse la cuenta.

## Variables

| Variable | Cuenta | Flujos |
|---|---|---|
| `QUIPU_E2E_EMAIL` | Verificada, onboarding completo, ciclo activo, Fondo creado, menos de 6 metas, sin ciclos cerrados, saldo para gastos chicos | smoke, gastos, Extra, plan, ajustes |
| `QUIPU_E2E_PASSWORD` | Contraseña de esa cuenta | los mismos |
| `QUIPU_E2E_SEED_FN` | Nombre de la función interna (TBD) | pre-paso, no lo leen los YAML |
| `QUIPU_E2E_FRESH_EMAIL` | La que acaba de crear el pre-paso, sin perfil | asistente, Sueldo que cierra, Progreso del primer cierre |
| `QUIPU_E2E_FRESH_PASSWORD` | Contraseña de esa cuenta | los mismos |
| `QUIPU_E2E_NO_CYCLE_EMAIL` | Verificada, onboarding completo, sin ciclo activo y sin compromisos | `home-vacio`, `sin-ciclo-solo-sueldo`; `home-primer-ingreso` una sola vez por cuenta |
| `QUIPU_E2E_NO_CYCLE_PASSWORD` | Contraseña | los mismos |

La contraseña incorrecta del flujo de entrar es el literal `clave-incorrecta`. No es una cuenta. Nada de esto va en los YAML.

`home-vacio` y `sin-ciclo-solo-sueldo` no guardan el ingreso. `home-primer-ingreso` registra S/ 3,000 y esa cuenta queda con ciclo.

## Espera arreglo pendiente

Estas afirmaciones describen la decisión de Capi. En `d7bcb41` todavía no pasan. Cuando llegue el PR del dueño, tienen que pasar.

| Afirmación | Dueño | Dónde |
|---|---|---|
| El paso 1 no muestra «DÍA DE PAGO», «El 1 de cada mes», «El 15 y 30 de cada mes», «Cada 7 días» ni «30 DÍAS» / «15 DÍAS» / «7 DÍAS» | Pixi | `onboarding-paso-1`, `onboarding-hasta-paso-4`, `onboarding-saldo-cero` |
| Mixto sin datos muestra «Indica la parte fija.» y «Agrega al menos una fuente.»; Variable muestra «Elige un ciclo de 15 o 30 días.» y «Agrega al menos una fuente.» | el texto está en el validador y no se pinta | `onboarding-paso-1` |
| Paso 5 e Inicio muestran el mismo «Hoy puedes gastar»: S/ 1,200 al 50/30/20 con cobro mañana es 960 ((600 + 360) / 1), con o sin Agua. No dice «en 30 días.» | Pixi | `assert-paso5-960`, `onboarding-ciclo`, `onboarding-abrir-ciclo` |
| Dinero de hoy vacío es S/ 0 en el paso 5 y en Inicio (`0.00`), no «—» ni «Anota el dinero que tienes hoy…» | Pixi | `onboarding-saldo-cero` |
| El primer ciclo no muestra «Saldo que quedó» | Pixi | `onboarding-ciclo`, `onboarding-abrir-ciclo`, `onboarding-saldo-cero` |
| La hoja de ingreso tiene «Sueldo» y «Extra» | Pixi | `registrar-ingreso`, `registrar-ingreso-tipo`, `extra-no-cierra`, `sueldo-cierra-ciclo`, `progreso-primer-cierre` |
| Un Sueldo de hoy, con cobro mañana, cambia la línea «CICLO …» de Movimientos y abre otro ciclo | Nubo + Pixi | `sueldo-cierra-ciclo` |
| Un Extra deja la misma línea «CICLO …» | Nubo + Pixi | `extra-no-cierra` |
| Sin ciclo activo solo se ve «Sueldo»; «Extra» no está | Pixi | `sin-ciclo-solo-sueldo` |
| Tras ese Sueldo, Progreso muestra «CICLOS CERRADOS EN VERDE» y «CICLO CERRADO», y no «Aún no cierras un ciclo.» | Nubo | `progreso-primer-cierre` |

El texto exacto con el que el servidor rechaza un Extra sin ciclo sigue por confirmar con Nubo. `sin-ciclo-solo-sueldo` no lo afirma: comprueba que la hoja no ofrece Extra.

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
| `home-daily` | Inicio | `shared/components/home/home-dense.tsx` | monto «Hoy puedes gastar» | `home-ciclo`, `onboarding-ciclo` |
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
