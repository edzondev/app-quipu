import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { HomeDense } from "@/shared/components/home/home-dense";
import { HomeEmpty, HomeLoading } from "@/shared/components/home/home-empty";
import { useHomeModel } from "@/shared/hooks/use-dashboard";

export default function HomePage() {
  const model = useHomeModel();
  const router = useRouter();

  return (
    <AppShell>
      {model.status === "loading" ? <HomeLoading /> : null}
      {model.status === "empty" ? <HomeEmpty /> : null}
      {model.status === "ready" ? (
        <HomeDense
          home={model.home}
          onViewAllMovements={() => router.push("/(tabs)/movements")}
        />
      ) : null}
    </AppShell>
  );
}
