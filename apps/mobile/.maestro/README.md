# Maestro — Quipu (`com.quipu.finance`)

Flujos E2E de la app móvil. No se ejecutan en CI: no hay emulador ni APK en este cambio. Los textos salen del código de `d7bcb41`. Donde no hay `testID` se usa el texto visible o el `accessibilityLabel`.

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

## Variables

| Variable | Cuenta | Flujos |
|---|---|---|
| `QUIPU_E2E_EMAIL` | Verificada, onboarding completo, ciclo activo, Fondo creado, menos de 6 metas, sin ciclos cerrados, saldo para gastos chicos | smoke y el resto con datos |
| `QUIPU_E2E_PASSWORD` | Contraseña de esa cuenta | los mismos |
| `QUIPU_E2E_FRESH_EMAIL` | Verificada, **sin perfil** | `onboarding-paso-1` y luego `onboarding-ciclo` |
| `QUIPU_E2E_FRESH_PASSWORD` | Contraseña | los mismos |
| `QUIPU_E2E_FRESH_SKIP_EMAIL` | Otra cuenta verificada, sin perfil | `onboarding-despues` |
| `QUIPU_E2E_FRESH_SKIP_PASSWORD` | Contraseña | el mismo |
| `QUIPU_E2E_NO_CYCLE_EMAIL` | Verificada, onboarding completo, **sin ciclo activo** y sin compromisos | `home-vacio` y, una sola vez, `home-primer-ingreso` |
| `QUIPU_E2E_NO_CYCLE_PASSWORD` | Contraseña | los mismos |

La contraseña incorrecta del flujo de entrar es el literal `clave-incorrecta`. No es una cuenta.

### One-shot

El servidor responde «Tu primer ciclo ya está creado.» si la cuenta fresca ya abrió su ciclo.

1. `onboarding-paso-1` no termina el asistente. Tiene que correr **antes** de `onboarding-ciclo` y con la misma cuenta fresca.
2. `onboarding-ciclo` gasta `QUIPU_E2E_FRESH_*`.
3. `onboarding-despues` gasta `QUIPU_E2E_FRESH_SKIP_*` («Después» no guarda compromisos).
4. `home-vacio` se puede repetir. `home-primer-ingreso` registra S/ 3,000 y deja la cuenta con ciclo.

El asistente actual siempre llama a `startFirstCycle`. Una cuenta sin ciclo no sale de «Empezar mi ciclo»: hay que prepararla aparte (perfil listo, sin ciclo).

## Qué no está aquí

Passkeys, código de correo, sin internet, cierre de ciclo, medianoche, rotación, accesibilidad, atrás de Android, doble toque y elegir en el calendario un día que no sea mañana. El paso 2 deja la fecha que el picker trae (mañana) y solo toca «Continuar».

«Cierre vacío» («Aún no hay un cierre.» / «Volver a Progreso») no tiene botón en Progreso vacío. No hay deep link en el flujo.

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
| `tab-progreso` | la misma | el mismo | Progreso | `progreso-vacio` |
