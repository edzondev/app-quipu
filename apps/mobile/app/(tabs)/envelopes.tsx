import { ScrollView, Text } from "react-native";
import AppShell from "@/shared/components/app-shell";
import AppTittle from "@/shared/components/app-title";
import { EnvelopeRows } from "@/shared/components/envelopes/envelope-rows";
import { useEnvelopeRows } from "@/shared/hooks/use-dashboard";

export default function EnvelopesPage() {
  const envelopes = useEnvelopeRows();

  return (
    <AppShell>
      <ScrollView contentContainerClassName="gap-5 pb-12">
        <AppTittle title="Sobres" className="font-semibold" />
        {envelopes.status === "loading" ? (
          <Text className="font-hanken text-[15px] text-foreground/55">
            Cargando…
          </Text>
        ) : null}
        {envelopes.status === "empty" ? (
          <Text className="font-hanken text-[15px] text-foreground/55">
            Todavía no hay sobres en el ciclo activo.
          </Text>
        ) : null}
        {envelopes.status === "ready" ? (
          <EnvelopeRows
            rows={envelopes.rows}
            symbol={envelopes.currencySymbol}
          />
        ) : null}
      </ScrollView>
    </AppShell>
  );
}
