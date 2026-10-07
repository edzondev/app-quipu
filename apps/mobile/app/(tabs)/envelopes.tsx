import AppShell from "@/shared/components/app-shell";
import { SobresScreen } from "@/shared/components/envelopes/sobres-screen";
import { useRegistrar } from "@/shared/components/navigation/registrar-context";
import { useSobresScreen } from "@/shared/hooks/use-dashboard";

export default function EnvelopesPage() {
  const sobres = useSobresScreen();
  const { openCreate } = useRegistrar();

  return (
    <AppShell>
      <SobresScreen
        status={sobres.status}
        screen={sobres.status === "ready" ? sobres.screen : null}
        onMoveMoney={() => {
          // No hay mutación de traspaso entre sobres.
        }}
        onRegisterExpense={openCreate}
      />
    </AppShell>
  );
}
