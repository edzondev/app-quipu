import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import ProfileView from "@/modules/profile/components/profile-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Administra tu información personal y preferencias de Quipu.",
};

export default async function ProfilePage() {
  const preloaded = await preloadAuthQuery(api.profiles.getMyProfile);
  return <ProfileView preloaded={preloaded} />;
}
