# Tests E2E (Maestro) — Quipu Mobile

Smoke público de las pantallas alcanzables sin sesión (intro, sign-in,
create-account). Sin backend ni credenciales.

## Requisitos

- Maestro CLI instalado (`curl -Ls "https://get.maestro.mobile.dev" | bash` o vía
  el canal habitual del equipo; verificar con `maestro --version`).
- Emulador Android `Pixel_9_Pro_XL` arrancado.
- Dev build de la app instalada (package `com.quipu.finance`).

## Instalar la dev build (una vez por build)

Desde `apps/mobile/` (el directorio `android/` ya está prebuilt):

```sh
npx expo run:android
```

Usa el backend Convex que tenía el entorno al compilar (`EXPO_PUBLIC_CONVEX_URL`).
El smoke no lo necesita, pero la app lo carga al arrancar.

## Ejecutar el smoke

```sh
# Desde apps/mobile/
pnpm maestro:smoke

# Equivalente directo
maestro test --include-tags=smoke .maestro/
```

Si un selector no coincide con el árbol real, inspeccionar antes de editar:

```sh
maestro hierarchy
```

> Copia los strings verbatim del árbol de accesibilidad; nunca de un screenshot.
