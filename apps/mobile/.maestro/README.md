# Maestro — Quipu (`com.quipu.finance`)

Una sola cuenta de desarrollo, desechable, que ya terminó el asistente y tiene un ciclo activo. Solo `QUIPU_E2E_EMAIL` y `QUIPU_E2E_PASSWORD`. Nunca producción (`patient-chihuahua-640`). El APK apunta al Convex dev `perceptive-elk-229`.

Los datos se acumulan. Donde hace falta, el nombre lleva la hora. No se afirman totales del historial. Si un flujo cierra el ciclo, el ingreso siguiente deja otro ciclo activo.

`maestro test .maestro/` corre lo que esa cuenta puede hacer. `config.yaml` excluye `wip`, `blocked`, `one-shot` y `cuenta-nueva`, y ordena la corrida con `executionOrder`. `pnpm maestro:smoke` es `maestro test --config .maestro/config.smoke.yaml --include-tags=smoke .maestro/` (ese config no tiene `executionOrder`, para no exigir flujos fuera de smoke).

## Cómo correrlo

Desde `apps/mobile`, con el emulador encendido:

- Java 17 o más (`JAVA_HOME`).
- Emulador API 34 con el APK `preview` instalado, apuntando al Convex dev `perceptive-elk-229`.
- Maestro CLI en el PATH.

```bash
maestro test .maestro/flows/welcome.yaml
maestro test --config .maestro/config.smoke.yaml --include-tags=smoke .maestro/ -e QUIPU_E2E_EMAIL=... -e QUIPU_E2E_PASSWORD=...
maestro test .maestro/ -e QUIPU_E2E_EMAIL=... -e QUIPU_E2E_PASSWORD=...
maestro test .maestro/flows/home-ciclo.yaml -e QUIPU_E2E_EMAIL=... -e QUIPU_E2E_PASSWORD=...
```

Resultados: `%USERPROFILE%\.maestro\tests`.

## Flujos de la corrida

| Flujo | Qué cubre |
|---|---|
| `welcome` | Bienvenida, sin cuenta |
| `sign-in` | Entrar con correo |
| `home-ciclo` | Inicio con ciclo |
| `preview-sin-selector-dev` | Progreso sin el selector de desarrollo |
| `registrar-gasto-hoja` | Gasto en la hoja |
| `movimientos` | Lista, filtros y búsqueda |
| `movimientos-editar-eliminar` | Editar y borrar un gasto |
| `registrar-ingreso` | Sumar al ciclo, sin cerrarlo. Sumar viene marcada |
| `sumar-no-cierra` | El rango del ciclo no cambia al sumar |
| `ciclo-nuevo-antes-del-fin` | Si el ciclo no empezó hoy, lo cierra. Si empezó hoy, afirma nuevo ciclo oculto y que CICLO empieza hoy. No está en smoke |
| `mismo-dia-solo-sumar` | Exige startedToday o falla. Sumar no cierra; el arrastre en Inicio no cambia |
| `plan-sobres` | Plan y sobres |
| `compromisos` | Alta y validación de un compromiso |
| `ahorro-metas` | Crear una meta |
| `ajustes-cerrar-sesion` | Seguridad y cierre de sesión |
| `controles-escondidos` | H4–H8: filas ocultas en Ajustes/Plan (Perfil, Plan, Reparto, Ciclo, Reparto del ciclo) y hoja de gasto |

Un ciclo que empezó hoy (día de Lima) oculta «Empieza un nuevo ciclo». No se arma un ciclo de ayer desde la UI, así que cerrar uno anterior es a lo sumo una vez por día. `ciclo-nuevo-antes-del-fin` no omite en silencio: si nuevo ciclo no está, afirma que CICLO empieza hoy. `mismo-dia-solo-sumar` no cierra para armarse; exige startedToday o falla. `config.yaml` deja primero el cierre y después el mismo-día. Smoke usa `config.smoke.yaml`.

## Fuera de la corrida

Los flujos `cuenta-nueva` quedan excluidos por defecto (`config.yaml`): no corren con `maestro test .maestro/` ni con el resto. Se corren uno por uno, con una cuenta en el estado que piden.

- `cuenta-nueva`: `onboarding-ciclo`, `onboarding-saldo-cero`, `onboarding-despues`, `onboarding-paso-1` (también `wip`). Cuenta sin perfil.
- `cuenta-nueva`: `home-vacio`, `sin-ciclo-solo-ciclo-nuevo`, `home-primer-ingreso` (también `one-shot`). Nunca hubo un ciclo.
- `cuenta-nueva`: `progreso-vacio`. Primer ciclo, historial vacío.
- `cuenta-nueva`, `wip` y `blocked`: `progreso-primer-cierre`. Ciclo de apertura empezado antes de hoy, sin cierres en verde.
- Ciclo vencido: no hay flujo.

Para correr uno, apunta las mismas dos variables a una cuenta en ese estado:

```bash
maestro test .maestro/flows/onboarding-ciclo.yaml -e QUIPU_E2E_EMAIL=... -e QUIPU_E2E_PASSWORD=...
```

Detalle de testID y pendientes: `NOTAS.md`.
