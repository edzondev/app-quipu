# Notas de Maestro

Una sola cuenta: `QUIPU_E2E_EMAIL` y `QUIPU_E2E_PASSWORD`. Nunca producción (`patient-chihuahua-640`).

Opcional, solo en el dev `perceptive-elk-229` y nunca `--prod`: `devSeed:seedVerifiedAccount` crea una cuenta verificada sin perfil; `devSeed:seedProfileNoCycle` crea una con perfil y sin ciclo (`home-vacio`, `sin-ciclo-solo-ciclo-nuevo`, `home-primer-ingreso`). La contraseña es `DEV_SEED_PASSWORD`. Para un flujo `cuenta-nueva` apunta esas dos variables a esa cuenta.

## Pendiente

| Afirmación | Dónde |
|---|---|
| El paso 1 sigue pintando «30 DÍAS» / «15 DÍAS» / «7 DÍAS» | `onboarding-paso-1`, `optional: true` |
| Mixto/Variable no pintan «Indica tu sueldo base.», «Agrega al menos una fuente.» ni «Elige un ciclo de 15 o 30 días.» | `onboarding-paso-1`, `optional: true`. La etiqueta sí es «TU SUELDO BASE» |
| Cierre muestra el subtítulo de la racha aunque `streakEvaluated` sea falso (M45) | `progreso-primer-cierre` no lo afirma |
| El mismo día se ven las dos opciones de ingreso (M45) | `mismo-dia-solo-sumar` |
| Ciclo vencido: no hay flujo. Inicio muestra «Tu ciclo del … terminó.» | `home-closed-cycle.tsx` |

La hoja de ingreso dice «Empieza un nuevo ciclo» y «Sumar al ciclo actual» (sin «¿?»). Los `id` son `income-mode-new-cycle`, `income-mode-add`, `income-extra-*` e `income-submit`. El paso 2 deja la fecha de mañana y no abre el diálogo nativo. El paso 3 es más/menos (`allocation-increase-needs`, `allocation-reset`).

No están: passkeys, código de correo, sin internet, medianoche, rotación, accesibilidad, doble toque, ni confirmar el diálogo de la fecha de cobro. El atrás de Android en el asistente es manual.

## testID que faltan

Los flujos ya usan `option-*`, `freq-option-*`, `cycle-pill-*`, `source-*`, `amount-input`, `pay-date-field`, `allocation-percent-needs`, `allocation-increase-needs`, `allocation-reset`, `chip-agua`, `commitment-amount-0`, `commitment-day-0`, `commitments-skip`, `commitments-total`, `confirm-*`, `wizard-back`, `income-mode-new-cycle`, `income-mode-add`, `income-extra-types`, `income-extra-custom`, `income-submit` y `progress-preview-live` (solo si el build es de desarrollo).

| testID propuesto | Pantalla | Archivo | Elemento | Flujo |
|---|---|---|---|---|
| `welcome-create-account` | Bienvenida | `modules/onboarding/components/welcome.tsx` | «Crear cuenta» | `welcome` |
| `welcome-sign-in` | Bienvenida | el mismo | «Ya tengo cuenta» | `welcome` |
| `welcome-example-amount` | Bienvenida | el mismo | `S/ 42.30` | `welcome` |
| `sign-in-email-method` | Entrar | `app/(auth)/sign-in.tsx` | «Entrar con correo» | `sign-in` |
| `sign-in-email` | Entrar | `shared/components/auth/auth-labeled-field.tsx` | campo Correo | `sign-in` |
| `sign-in-password` | Entrar | el mismo | campo Contraseña | `sign-in` |
| `sign-in-submit` | Entrar | `shared/components/auth/auth-button.tsx` | «Entrar» | `sign-in` |
| `wizard-continue` | Asistente, pasos 1–4 | cada paso | «Continuar» | onboarding |
| `wizard-start` | Paso 5 | `modules/onboarding/components/step-confirm.tsx` | «Empezar mi ciclo» | `onboarding-ciclo`, `onboarding-despues` |
| `field-error-mixed` | Paso 1 | `step-1-income-profile.tsx` | no pinta «Indica tu sueldo base.» | `onboarding-paso-1` |
| `field-error-sources` | Paso 1 | el mismo | «Agrega al menos una fuente.» | `onboarding-paso-1` |
| `field-error-cycle` | Paso 1 | el mismo | «Elige un ciclo de 15 o 30 días.» | `onboarding-paso-1` |
| `home-daily` | Inicio | `shared/components/home/home-dense.tsx` | monto «Hoy puedes gastar» | onboarding, `home-ciclo` |
| `home-cycle-day` | Inicio | el mismo | «Día X/Y» | `home-ciclo` |
| `home-envelope-needs` | Inicio | el mismo | fila Necesidades | `home-ciclo` |
| `home-envelope-wants` | Inicio | el mismo | fila Gustos | `home-ciclo` |
| `home-envelope-savings` | Inicio | el mismo | fila Ahorro | `home-ciclo` |
| `home-carry` | Inicio | el mismo | «Saldo que quedó…» | `ciclo-nuevo-antes-del-fin` (opcional) |
| `home-view-movements` | Inicio | `home-dense.tsx` | «Ver todos» | `home-ciclo` |
| `home-register-income` | Inicio vacío | `shared/components/home/home-empty.tsx` | «Registrar ingreso» | `home-vacio`, `home-primer-ingreso` |
| `goal-submit` | Hoja de meta | pendiente, Pixi. No está en `goal-form.tsx` | «Crear meta» | `ahorro-metas` |
