# Maestro — Quipu (`com.quipu.finance`)

Una sola cuenta de desarrollo, desechable, que ya terminó el asistente y tiene un ciclo activo. Solo `QUIPU_E2E_EMAIL` y `QUIPU_E2E_PASSWORD`. Nunca producción (`patient-chihuahua-640`). El APK apunta al Convex dev `perceptive-elk-229`.

Los datos se acumulan. Donde hace falta, el nombre lleva la hora. No se afirman totales del historial. Si un flujo cierra el ciclo, el ingreso siguiente deja otro ciclo activo.

`maestro test .maestro/` corre lo que esa cuenta puede hacer. `config.yaml` excluye `wip`, `blocked`, `one-shot` y `cuenta-nueva`. `pnpm maestro:smoke` es `maestro test --include-tags=smoke .maestro/`.

## Cómo correrlo

Desde `apps/mobile`, con el emulador encendido:

- Java 17 o más (`JAVA_HOME`).
- Emulador API 34 con el APK `preview` instalado, apuntando al Convex dev `perceptive-elk-229`.
- Maestro CLI en el PATH.

```bash
maestro test .maestro/flows/welcome.yaml
maestro test --include-tags=smoke .maestro/ -e QUIPU_E2E_EMAIL=... -e QUIPU_E2E_PASSWORD=...
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
| `registrar-gasto-completo` | Gasto en pantalla completa |
| `movimientos` | Lista, filtros y búsqueda |
| `movimientos-editar-eliminar` | Editar y borrar un gasto |
| `registrar-ingreso` | Sumar al ciclo, sin cerrarlo |
| `sumar-no-cierra` | El rango del ciclo no cambia al sumar |
| `ciclo-nuevo-antes-del-fin` | Cierra el ciclo y abre otro |
| `plan-sobres` | Plan y sobres |
| `compromisos` | Alta y validación de un compromiso |
| `ahorro-metas` | Crear una meta |
| `ajustes-cerrar-sesion` | Seguridad y cierre de sesión |
| `controles-escondidos` | Lo que todavía no se muestra |

## Fuera de la corrida

- `cuenta-nueva`: `onboarding-ciclo`, `onboarding-saldo-cero`, `onboarding-despues`, `onboarding-paso-1` (también `wip`). Cuenta sin perfil.
- `cuenta-nueva`: `home-vacio`, `sin-ciclo-solo-ciclo-nuevo`, `home-primer-ingreso` (también `one-shot`). Nunca hubo un ciclo.
- `cuenta-nueva`: `progreso-vacio`. Primer ciclo, historial vacío.
- `cuenta-nueva` y `wip`: `mismo-dia-solo-sumar`. El ciclo tiene que haber empezado hoy (M45).
- `cuenta-nueva`, `wip` y `blocked`: `progreso-primer-cierre`. Ciclo de apertura empezado antes de hoy, sin cierres en verde.
- Ciclo vencido: no hay flujo.

Para correr uno, apunta las mismas dos variables a una cuenta en ese estado:

```bash
maestro test .maestro/flows/onboarding-ciclo.yaml -e QUIPU_E2E_EMAIL=... -e QUIPU_E2E_PASSWORD=...
```

Detalle de testID y pendientes: `NOTAS.md`.
