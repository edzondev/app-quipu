import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import SettingsView from "@/modules/settings/components/settings-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración",
  description:
    "Ajusta tus compromisos fijos, distribución de sobres y preferencias de cuenta.",
};

export default async function SettingsPage() {
  const preloaded = await preloadAuthQuery(api.profiles.getMyProfile);
  return <SettingsView preloaded={preloaded} />;
}
