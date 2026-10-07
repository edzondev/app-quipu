import { ScrollView, Text, View } from "react-native";
import AppShell from "@/shared/components/app-shell";
import AppTittle from "@/shared/components/app-title";
import { useSavingsOverview } from "@/shared/hooks/use-savings";
import { formatCents } from "@/shared/lib/money";
import type { SavingsModel } from "@/shared/lib/savings/model";

export default function SavingsPage() {
  const savings = useSavingsOverview();

  return (
    <AppShell>
      <ScrollView contentContainerClassName="gap-5 pb-12">
        <AppTittle title="Ahorro" className="font-semibold" />
        {savings.status === "loading" ? (
          <Text className="font-hanken text-[15px] text-foreground/55">
            Cargando…
          </Text>
        ) : null}
        {savings.status === "empty" ? (
          <Text className="font-hanken text-[15px] text-foreground/55">
            Aún no hay ahorro registrado.
          </Text>
        ) : null}
        {savings.status === "ready" ? (
          <SavingsBody model={savings.model} />
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

function SavingsBody({ model }: { model: SavingsModel }) {
  const symbol = model.currencySymbol;
  return (
    <View className="gap-5">
      <View className="gap-1">
        <Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.18em] text-foreground/45">
          Total ahorrado
        </Text>
        <Text className="font-newsreader text-[32px] text-foreground">
          {formatCents(model.totalSavedCents, symbol)}
        </Text>
        {model.hasActiveCycle ? (
          <Text className="font-hanken text-[14px] text-foreground/55">
            Aporte del ciclo {formatCents(model.cycleContributionCents, symbol)}
          </Text>
        ) : null}
      </View>
      {model.emergencyFund ? (
        <FundRow
          label={model.emergencyFund.label}
          current={model.emergencyFund.currentAmount}
          target={model.emergencyFund.targetAmount}
          progress={model.emergencyFund.progressPercent}
          detail={model.emergencyFund.monthsCoveredCopy}
          symbol={symbol}
        />
      ) : (
        <Text className="font-hanken text-[15px] text-foreground/55">
          El fondo de emergencia aparece cuando terminas de armar tu sistema.
        </Text>
      )}
      <View className="gap-3">
        <Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.18em] text-foreground/45">
          Metas
        </Text>
        {model.goals.length === 0 ? (
          <Text className="font-hanken text-[15px] text-foreground/55">
            Sin metas todavía.
          </Text>
        ) : (
          model.goals.map((goal) => (
            <FundRow
              key={goal.id}
              label={goal.label}
              current={goal.currentAmount}
              target={goal.targetAmount}
              progress={goal.progressPercent}
              symbol={symbol}
            />
          ))
        )}
      </View>
    </View>
  );
}

function FundRow({
  label,
  current,
  target,
  progress,
  detail,
  symbol,
}: {
  label: string;
  current: number;
  target: number | null;
  progress: number;
  detail?: string;
  symbol: string;
}) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="font-hanken-semibold text-[15px] text-foreground">
          {label}
        </Text>
        <Text className="font-newsreader text-[16px] text-foreground">
          {formatCents(current, symbol)}
          {target != null ? ` / ${formatCents(target, symbol)}` : ""}
        </Text>
      </View>
      <View className="h-0.75 w-full overflow-hidden rounded-full bg-[#E8E6DF]">
        <View
          className="h-full rounded-full bg-savings"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </View>
      {detail ? (
        <Text className="font-hanken text-[13px] text-foreground/45">
          {detail}
        </Text>
      ) : null}
    </View>
  );
}
