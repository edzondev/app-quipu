/**
 * Bootstrap del SDK de PostHog para Next.js 16 App Router.
 *
 * Este archivo se ejecuta una sola vez en el cliente al cargar el bundle.
 * La configuración real vive en `core/analytics/client.ts`; este wrapper
 * existe solo porque Next.js lo requiere en la ruta convencional
 * `instrumentation-client.ts` (ver docs/nextjs_knowledge.md §"instrumentation").
 *
 * Si en el futuro migramos a `instrumentation.ts` server-side, mantenemos
 * este archivo para el cliente y agregamos un `instrumentation.ts` separado
 * para el servidor.
 */

import { initBotId } from "botid/client/core";
import { initPostHog } from "@/core/analytics";

initBotId({
	protect: [{ path: "/api/auth/*", method: "POST" }],
});

initPostHog();
