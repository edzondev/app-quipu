import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import ProfileView from "@/modules/profile/components/profile-view";

export default async function ProfilePage() {
  const preloaded = await preloadAuthQuery(api.profiles.getMyProfile);
  return <ProfileView preloaded={preloaded} />;
}
