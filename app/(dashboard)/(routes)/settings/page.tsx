import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import SettingsView from "@/modules/settings/components/settings-view";

export default async function SettingsPage() {
  const preloaded = await preloadAuthQuery(api.profiles.getMyProfile);
  return <SettingsView preloaded={preloaded} />;
}
