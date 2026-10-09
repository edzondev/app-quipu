# Maestro — Quipu (`com.quipu.finance`)

Flujos E2E de la app móvil. No se ejecutan en CI: no hay emulador ni APK en este cambio. Donde no hay `testID` se usa el texto visible o el `accessibilityLabel`.

Los flujos están sobre `f93107b` (incluye `99e2e3b`). La hoja usa `income-mode-new-cycle` y `income-mode-add`. El reparto del asistente es con botones de más y menos. `config.yaml` excluye `one-shot`, `wip` y `blocked`. `pnpm maestro:smoke` sigue usando `--include-tags=smoke`, que tiene prioridad.

## Cómo correrlos

Desde `apps/mobile`, con el APK ya instalado:

```bash
maestro test --include-tags=smoke .maestro/
```

Ese es el script `pnpm maestro:smoke`. `smoke` es la corrida repetible con la cuenta de datos: bienvenida, entrar, Inicio, un gasto en la hoja, Movimientos y `preview-sin-selector-dev`.

`preview-sin-selector-dev` entra con `QUIPU_E2E_EMAIL`, abre Progreso y afirma que no están el selector de escenarios ni sus `id`: `progress-preview-picker`, `progress-preview-live`, `progress-preview-sinCiclos`, `progress-preview-primerCierre`, `progress-preview-rachaSeis`, `progress-preview-rachaRota`, ni el texto «Vista de prueba · solo desarrollo». Eso solo existe con `__DEV__` (`progress-preview-picker.tsx`). Si aparece, el APK de preview es un build de desarrollo. `progreso-vacio` y `progreso-primer-cierre` siguen tocando `progress-preview-live` con `optional: true`, así que en el APK de preview ese toque no corre.

Otras corridas:

```bash
maestro test --include-tags=onboarding .maestro/
maestro test --include-tags=no-cycle .maestro/
maestro test --include-tags=one-shot .maestro/flows/home-primer-ingreso.yaml
maestro test .maestro/flows/onboarding-ciclo.yaml
```

`config.yaml` lista solo `flows/`. `subflows/` no se corre solo.

## Cómo correrlo en Windows

Para Edzon, en su PC, con el emulador de Android Studio API 34 (Google APIs, x86_64). Maestro no se corre en este repo.

Requisitos, según [la instalación oficial](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli):

- Java 17 o más. Él tiene 21. `JAVA_HOME` tiene que apuntar a ese JDK y `java` tiene que estar en el PATH.
- Android Studio con un AVD API 34, imagen Google APIs, x86_64, encendido antes de Maestro.
- `adb` en el PATH (platform-tools del SDK).
- Maestro CLI en Windows, no en WSL. Bajar `maestro.zip` de las releases, extraerlo (por ejemplo `C:\maestro`) y agregar `C:\maestro\bin` al PATH. En PowerShell: `setx PATH "%PATH%;C:\maestro\bin"`. Cerrar y abrir la terminal. Comprobar con `maestro --help`.

El binario tiene que ser un build EAS del perfil `preview` (`apps/mobile/eas.json`), apuntando al Convex de desarrollo `perceptive-elk-229`. No uses `production` ni `patient-chihuahua-640`. [Expo](https://docs.expo.dev/build-reference/apk) dice que el formato por defecto de Android en EAS Build es un Android App Bundle (`.aab`), y que un `.aab` no se instala directo en el teléfono o el emulador. Para generar un `.apk`, la misma página dice agregar en el perfil una de estas propiedades: `developmentClient: true`, `distribution: "internal"`, `android.buildType: "apk"`, o un `android.gradleCommand` que produzca un `.apk` (el ejemplo `preview4` es solo `distribution: "internal"`). El perfil `preview` de este repo ya tiene `distribution: "internal"`, así que ese build ya sale como `.apk`. No hace falta agregar `android.buildType`. Instálalo igual con `adb`:

```powershell
adb install -r C:\ruta\app-preview.apk
```

Variables, sin valores reales. Desde `apps/mobile`:

```powershell
$env:QUIPU_E2E_EMAIL="..."
$env:QUIPU_E2E_PASSWORD="..."
pnpm maestro:smoke
```

Lo mismo con `-e`, sin dejarlas en la sesión:

```powershell
maestro test --include-tags=smoke .maestro/ -e QUIPU_E2E_EMAIL=... -e QUIPU_E2E_PASSWORD=...
```

`pnpm maestro:smoke` es `maestro test --include-tags=smoke .maestro/`.

La semilla se corre desde `apps/web`, solo contra el dev. Nunca `--prod`. `DEV_SEED_PASSWORD` ya tiene que estar en el entorno del deployment; no se escribe en el repo.

```powershell
$EMAIL = "maestro-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@example.com"
npx convex run devSeed:seedVerifiedAccount ('{"email":"' + $EMAIL + '"}')
$env:QUIPU_E2E_FRESH_EMAIL = $EMAIL
$env:QUIPU_E2E_FRESH_PASSWORD = $env:DEV_SEED_PASSWORD
```

`maestro test .maestro/` lee `config.yaml` y no corre flujos con tag `wip`, `blocked` ni `one-shot`. Un solo flujo es el archivo: `maestro test .maestro/flows/home-ciclo.yaml`. Maestro busca `config.yaml` cuando le pasas un directorio ([configuración del proyecto](https://docs.maestro.dev/maestro-flows/workspace-management/project-configuration)); al pasarle un archivo, corre ese flujo.

Los artefactos van a `%USERPROFILE%\.maestro\tests` (`%userprofile%\.maestro\tests` en la [guía de reportes](https://docs.maestro.dev/maestro-flows/workspace-management/test-reports-and-artifacts)). Cada corrida es una carpeta con fecha dentro de esa ruta, por ejemplo `2026-07-31_173617`. Para un XML de JUnit, que no entra en esa carpeta:

```powershell
maestro test --include-tags=smoke .maestro/ --format junit --output informe.xml
```

Sin `--output`, Maestro escribe `report.xml` en el directorio actual. `--test-output-dir` cambia solo la carpeta de capturas y logs.

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

## Pre-paso: cuenta nueva (`devSeed:seedVerifiedAccount`, #107)

`internalMutation` en `apps/web/convex/devSeed.ts`. El único argumento es `email`. La contraseña sale de `DEV_SEED_PASSWORD` en el deployment; la función no la devuelve. El cliente no puede llamarla. Solo corre si `ALLOW_DEV_SEED` es exactamente `"true"` y `CONVEX_CLOUD_URL` es `perceptive-elk-229`. Producción (`patient-chihuahua-640`) no tiene el flag. No uses `--prod`. No uses `resetAll`.

Desde `apps/web`, con el CLI apuntando a ese dev:

```bash
EMAIL="maestro-$(date +%s)@example.com"
npx convex run devSeed:seedVerifiedAccount "{\"email\":\"$EMAIL\"}"
export QUIPU_E2E_FRESH_EMAIL="$EMAIL"
export QUIPU_E2E_FRESH_PASSWORD="$DEV_SEED_PASSWORD"
```

Devuelve `{ email, userId, emailVerified: true, hasProfile: false }`. La cuenta entra al asistente. Errores del código: «ALLOW_DEV_SEED no está habilitado.», «DEV_SEED_PASSWORD no está configurada.», «Ya existe una cuenta con ese correo.», «Solo disponible en el deployment de desarrollo (perceptive-elk-229).».

Flujos que piden ese pre-paso: `onboarding-paso-1`, `onboarding-ciclo`, `onboarding-despues`, `onboarding-saldo-cero`, `mismo-dia-solo-sumar`, `sumar-no-cierra`, `progreso-vacio`. Hay una sola variable `QUIPU_E2E_FRESH_*` por corrida. `--include-tags=onboarding` no puede compartirla: hace falta una cuenta nueva por flujo. Un `onFlowStart` que llame por HTTP a un endpoint de seed solo en dev queda pendiente (Nato).

`devSeed:seedVerifiedAccount` no crea perfil ni ciclo. Nato va a agregar dos semillas más (nombres por confirmar): una con perfil y **ningún ciclo en la vida de la cuenta**, y otra con ciclo activo. `QUIPU_E2E_NO_CYCLE_*` y `QUIPU_E2E_EMAIL` saldrán de esas dos. No uses una cuenta personal.

Hacen falta tres semillas más, nombres por confirmar, nunca una cuenta personal:

- Ciclo que **empezó antes de hoy** y todavía no vence, una cuenta nueva por corrida: `QUIPU_E2E_PRIOR_CYCLE_*`. La usan `registrar-ingreso` (tiene que ver las dos opciones) y `ciclo-nuevo-antes-del-fin` (además le tienen que quedar varios días). Una semilla de hoy no sirve.
- Ciclo de **apertura empezado antes de hoy**: `QUIPU_E2E_OPENING_PRIOR_*`. `progreso-primer-cierre` está bloqueado hasta esa semilla.
- Ciclo ya vencido (`pastEnd`): `QUIPU_E2E_EXPIRED_*`. El flujo `ciclo-vencido` no está escrito. Cuando exista afirma «Empieza un nuevo ciclo» con `selected: true`, y que «Gasto» abre «NUEVO GASTO» (Notion `3f486a7356a6816691daf0877414cf26`).
- Primer ingreso, una cuenta por corrida que nunca tuvo ciclo: `QUIPU_E2E_FIRST_INCOME_*`. Solo `home-primer-ingreso`. No comparte `QUIPU_E2E_NO_CYCLE_*`.
- Metas, una cuenta por corrida: `QUIPU_E2E_GOALS_*`. Solo `ahorro-metas`. La pantalla no deja borrar la meta.

## Variables

| Variable | Cuenta | Flujos |
|---|---|---|
| `QUIPU_E2E_EMAIL` | Semilla futura de ciclo **activo y sin vencer**, con Fondo, menos de 6 metas y saldo. No es una cuenta personal. No la uses en flujos que registran un ingreso | smoke, gastos, plan, ajustes |
| `QUIPU_E2E_PASSWORD` | Contraseña de esa cuenta | los mismos |
| `QUIPU_E2E_FRESH_EMAIL` | El `email` pasado a `devSeed:seedVerifiedAccount`, uno nuevo por corrida | asistente, `mismo-dia-solo-sumar`, `sumar-no-cierra`, `progreso-vacio` |
| `QUIPU_E2E_FRESH_PASSWORD` | El mismo valor que `DEV_SEED_PASSWORD` en el deployment dev. No va en el repo | los mismos |
| `QUIPU_E2E_NO_CYCLE_EMAIL` | Semilla futura: perfil completo y **nunca tuvo un ciclo**. No es «ciclo vencido» ni una cuenta personal | `home-vacio`, `sin-ciclo-solo-ciclo-nuevo` |
| `QUIPU_E2E_FIRST_INCOME_EMAIL` | Semilla futura, una cuenta nueva por corrida, nunca tuvo un ciclo. Este flujo la deja con ciclo | `home-primer-ingreso` (`one-shot`) |
| `QUIPU_E2E_FIRST_INCOME_PASSWORD` | Contraseña | el mismo |
| `QUIPU_E2E_GOALS_EMAIL` | Semilla futura, una cuenta nueva por corrida, con ciclo y lugar para metas | `ahorro-metas` |
| `QUIPU_E2E_GOALS_PASSWORD` | Contraseña | el mismo |
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

La hoja dice «Empieza un nuevo ciclo» y «Sumar al ciclo actual». Los flujos tocan `income-mode-new-cycle`, `income-mode-add` e `income-submit`. Si el perfil es de planilla y se suma al ciclo, aparecen los tipos (`income-extra-*`); se elige `income-extra-custom` («Otro»). Inicio con ciclo ya no tiene «+ Ingreso»: se entra por la pestaña «Registrar». El saludo es «Hola» o «Hola, » más el primer nombre.

El paso 2 deja la fecha que ya viene (mañana) y solo toca «Continuar». Esa fecha se muestra como `9 oct 2026` (`formatPayDate`), no con el idioma del teléfono. El diálogo nativo de Android (`pay-date-field`, botones «Listo» y «Cancelar» puestos en el código) no se abre. El paso 3 usa `allocation-increase-needs`, `allocation-decrease-*` y `allocation-reset`; ya no hay sliders ni «Suma 100%».

La cuenta fija `QUIPU_E2E_EMAIL` acumula gastos y compromisos (`registrar-gasto-*`, `movimientos`, `compromisos`). «Hoy puedes gastar» baja. No hay `onFlowComplete` para eso: si el flujo falla antes de crear la fila, borrar al final tumbaría la corrida. `movimientos-editar-eliminar` sí borra el gasto que crea. `ahorro-metas` y `home-primer-ingreso` usan cuenta propia.

## Espera arreglo pendiente

Hecho en #106 (`f98b65b`): el paso 1 no muestra «DÍA DE PAGO», «El 1 de cada mes», «El 15 y 30 de cada mes» ni «Cada 7 días». El paso 5 no muestra «Puedes gastar hoy», `confirm-daily` ni «Después de compromisos y ahorro, en N días.». Inicio muestra `S/ 960.00` o `S/ 0.00`. El primer ciclo no muestra «Saldo que quedó …».

Estas afirmaciones todavía no pasan. Cuando llegue el cambio del dueño, tienen que pasar.

| Afirmación | Dueño | Dónde |
|---|---|---|
| El paso 1 no muestra «30 DÍAS» / «15 DÍAS» / «7 DÍAS». `cyclePreview` sigue pintando «1 – 30 de cada mes · 30 DÍAS», «· 15 DÍAS» y «7 DÍAS» | pendiente conocido | `onboarding-paso-1` las marca `optional: true` |
| Mixto sin datos muestra «Indica tu sueldo base.» y «Agrega al menos una fuente.»; Variable muestra «Elige un ciclo de 15 o 30 días.» y «Agrega al menos una fuente.» | el validador no pinta el texto | `onboarding-paso-1`, `optional: true`. La etiqueta visible de Mixto es «TU SUELDO BASE» |
| La racha cuenta solo si pasaron 24 horas reales, y nunca el ciclo de apertura. Cierre sigue pintando el subtítulo con `streakEvaluated` en falso (M45) | pendiente M45 | `progreso-primer-cierre` no afirma ese subtítulo; tags `wip` y `blocked` |
| El mismo día de Lima se ven «Empieza un nuevo ciclo» y «Sumar al ciclo actual» (M45) | pendiente M45 | `mismo-dia-solo-sumar`, tag `wip` |

Un ciclo vencido no se cierra solo. Inicio muestra la tarjeta que ya está en `home-closed-cycle.tsx`: «Tu ciclo del <inicio> al <fin> terminó.», «Te quedaron …» o «Te pasaste por …», «Tus movimientos siguen guardados.» y «Registrar nuevo ingreso». «Sumar al ciclo actual» se queda en ese ciclo. «Empieza un nuevo ciclo» lo cierra, salvo que sea el mismo día de Lima (#109). El flujo `ciclo-vencido` espera `QUIPU_E2E_EXPIRED_*`.

Cerrar el ciclo de apertura lo anota en el historial de Progreso. No cuenta en «CICLOS CERRADOS EN VERDE» ni en la racha: `progreso-primer-cierre` afirma `^0$` debajo de ese título, junto a «CICLO CERRADO · …». Está bloqueado hasta `QUIPU_E2E_OPENING_PRIOR_*`.

La hoja no tiene calendario. «Fecha» muestra «Hoy · …» y no se puede cambiar. Son casos de API y de la web de desarrollo, sin flujo de Maestro:

- Fecha futura, un día de Lima después de hoy (más tarde hoy vale): «La fecha del ingreso no puede ser futura.» Notion `3f486a7356a681f5ad2dc25bcda0499c`.
- «Sumar al ciclo actual» con fecha anterior al inicio: «La fecha del ingreso no puede ser anterior al inicio del ciclo.» Notion `3f486a7356a6814bb142d69eff7f1558`.
- Sumar sin ningún ciclo: «Registra primero tu sueldo para empezar un ciclo nuevo.» Notion `3f486a7356a6819786ecce6a1650094c`.

Qué opción viene marcada, como en `initialIncomeKind`: si el ciclo está abierto, «Sumar al ciclo actual»; si está vencido o no hay ciclo, «Empieza un nuevo ciclo». Sin ningún ciclo esa es la única opción. `registrar-ingreso` afirma «Sumar al ciclo actual» con `selected: true`. `ciclo-nuevo-antes-del-fin` toca «Empieza un nuevo ciclo». El flujo futuro `ciclo-vencido` afirma «Empieza un nuevo ciclo» con `selected: true`, y que «Gasto» sigue activo: toca «Gasto» y ve «NUEVO GASTO». Los botones exponen `accessibilityState.selected`.

El mismo día de Lima, las dos opciones se ven. Es pendiente M45: `mismo-dia-solo-sumar` tiene tag `wip` y no entra en `maestro test .maestro/`. El servidor suma el ingreso habitual (`cycleStartedOnLimaDay`). El flujo toca «Empieza un nuevo ciclo» y el rango de «CICLO» no cambia. El texto «Empieza un nuevo ciclo» no lleva «¿?»; eso ya es el copy final.

«Anota el dinero que tienes hoy para ver tu número.» está en el paso 5 (`step-confirm.tsx`). `onboarding-saldo-cero` lo afirma.

## Qué no está aquí

Passkeys, código de correo, sin internet, medianoche, rotación, accesibilidad, doble toque y confirmar el diálogo nativo de la fecha de cobro. El paso 2 deja mañana y solo toca «Continuar».

El atrás de Android en el asistente es manual (Capi: pasos 2 a 5 vuelven al paso anterior; el paso 1 vuelve a la Bienvenida). Los flujos solo usan la flecha de la app (`wizard-back`), que ya va al paso anterior.

«Cierre vacío» («Aún no hay un cierre.» / «Volver a Progreso») no tiene botón en Progreso vacío. No hay deep link en el flujo. Cerrar un ciclo esperando días, con la web o con una fecha que el teléfono no deja elegir sigue siendo manual. El mismo día de Lima el habitual se suma (`mismo-dia-solo-sumar`). Cerrar el ciclo de apertura en un día posterior está en `progreso-primer-cierre` (tag `blocked`) y no suma racha si no pasaron 24 horas reales.

## testID que faltan

Los flujos ya usan estos `id`: asistente (`option-*`, `freq-option-*`, `cycle-pill-*`, `source-*`, `amount-input`, `pay-date-field`, `allocation-percent-needs`, `allocation-increase-needs`, `allocation-reset`, `chip-agua`, `commitment-amount-0`, `commitment-day-0`, `commitments-skip`, `commitments-total`, `confirm-*`, `wizard-back`) y hoja de ingreso (`income-mode-new-cycle`, `income-mode-add`, `income-extra-types`, `income-extra-custom`, `income-submit`). También existen y estos flujos no los necesitan: `pay-date-picker` (solo con el diálogo abierto), `allocation-decrease-*`, `allocation-amount-*`, `allocation-bar`, `commitment-error-*`, `field-error-nextPayDate`, `field-error-openingBalanceCents`, `progress-preview-*`, `tabs-top-inset`. El resto usa texto. Conviene agregar:

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
| `home-view-movements` | Inicio | `home-dense.tsx` | «Ver todos» | `home-ciclo` |
| `home-register-income` | Inicio vacío | `shared/components/home/home-empty.tsx` | «Registrar ingreso» | `home-vacio`, `home-primer-ingreso` |
| `registrar-mode-expense` | Hoja | `shared/components/navigation/registrar-sheet.tsx` | «Gasto» | registrar, `home-vacio` |
| `registrar-mode-income` | Hoja | el mismo | «Ingreso» | registrar, `home-vacio` |
| `registrar-fab` | Tab | `shared/components/navigation/registrar-tab-button.tsx` | botón central | registrar |
| `keypad-0` … `keypad-9`, `keypad-backspace` | Teclado | `shared/components/expenses/expense-keypad.tsx` | teclas | registrar |
| `expense-submit` | Hoja de gasto | `shared/components/expenses/expense-sheet-form.tsx` | «Registrar gasto» | `registrar-gasto-hoja` |
| `envelope-needs` | Sobres del gasto | `shared/components/expenses/envelope-choices.tsx` | «Necesidades» | registrar, compromisos |
| `envelope-wants` | el mismo | el mismo | «Gustos» | registrar |
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
| `sign-in-email` | Entrar | propuesto, Pixi. Hoy el campo y la etiqueta comparten «Correo» | campo Correo | `entrar`, `sign-in` |
| `sign-in-password` | Entrar | propuesto, Pixi | campo Contraseña | los mismos |
| `sign-in-submit` | Entrar | propuesto, Pixi | «Entrar» | los mismos |
| `expense-submit` | Hoja de gasto | propuesto, Pixi | «Registrar gasto» | `registrar-gasto-hoja` |
| `expense-save` | Gasto completo | propuesto, Pixi | «Registrar gasto» / «Guardar» | `registrar-gasto-completo`, editar |
| `income-sheet` | Hoja de ingreso | propuesto, Pixi | contenedor de la hoja | registrar ingreso |
| `expense-sheet` | Hoja de gasto | propuesto, Pixi | contenedor de la hoja | `registrar-gasto-hoja` |
| `expense-detail-screen` | Gasto completo | propuesto, Pixi | pantalla «REGISTRAR GASTO» | `registrar-gasto-completo` |
| `progress-closed-cycle` | Progreso | `apps/mobile/shared/components/progress/progress-screen.tsx` | «CICLO CERRADO · <MES>» | `progreso-primer-cierre` |
| `progress-closed-count` | Progreso | el mismo | «CICLOS CERRADOS EN VERDE» | `progreso-primer-cierre` |
