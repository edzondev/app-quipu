import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import AppShell from "@/shared/components/app-shell";
import SignOutButton from "@/shared/components/auth/sign-out-button";
import { EnvelopeRows } from "@/shared/components/envelopes/envelope-rows";
import { useHomeModel } from "@/shared/hooks/use-dashboard";
import type { BadgeTone, HomeTone } from "@/shared/lib/dashboard/home-model";
import { formatCents } from "@/shared/lib/money";

const TONE_DOT: Record<HomeTone, string> = {
  needs: "bg-needs",
  wants: "bg-wants",
  savings: "bg-savings",
  income: "bg-foreground/35",
};

const BADGE: Record<BadgeTone, { wrap: string; dot: string; text: string }> = {
  stable: {
    wrap: "bg-stable/15",
    dot: "bg-stable",
    text: "text-stable",
  },
  attention: {
    wrap: "bg-warning/15",
    dot: "bg-warning",
    text: "text-warning",
  },
  risk: {
    wrap: "bg-danger/15",
    dot: "bg-danger",
    text: "text-danger",
  },
  starting: {
    wrap: "bg-foreground/10",
    dot: "bg-foreground/40",
    text: "text-foreground/70",
  },
};

const TRACK = "bg-[#E8E6DF]";

function Money({
  cents,
  symbol,
  size = "lg",
  className = "",
}: {
  cents: number;
  symbol: string;
  size?: "lg" | "sm";
  className?: string;
}) {
  const [intPart, decPart] = (cents / 100).toFixed(2).split(".");
  const isLg = size === "lg";
  return (
    <Text
      className={`font-newsreader ${isLg ? "text-[64px] leading-17" : "text-[16px] leading-5"} text-foreground ${className}`}
      selectable
    >
      {symbol}{" "}
      <Text
        className={isLg ? "text-[64px] leading-17" : "text-[16px] leading-5"}
      >
        {intPart}
      </Text>
      <Text
        className={`${isLg ? "text-[28px] leading-8" : "text-[12px] leading-4"} text-foreground/45 font-newsreader`}
      >
        .{decPart}
      </Text>
    </Text>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
      {children}
    </Text>
  );
}

function Divider() {
  return <View className="h-px w-full bg-[#E8E6DF]" />;
}

function StatusCopy({ children }: { children: string }) {
  return (
    <Text className="font-hanken text-[15px] text-foreground/55">
      {children}
    </Text>
  );
}

export default function HomePage() {
  const model = useHomeModel();

  return (
    <AppShell>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-12 gap-8"
        showsVerticalScrollIndicator={false}
      >
        {model.status !== "ready" ? (
          <View className="flex-row justify-end">
            <SignOutButton />
          </View>
        ) : null}
        {model.status === "loading" ? <StatusCopy>Cargando…</StatusCopy> : null}
        {model.status === "empty" ? (
          <StatusCopy>
            Registra tu primer ingreso para activar tu ciclo y ver cuánto puedes
            gastar hoy.
          </StatusCopy>
        ) : null}
        {model.status === "ready" ? <HomeBody model={model.home} /> : null}
      </ScrollView>
    </AppShell>
  );
}

function HomeBody({
  model,
}: {
  model: Extract<ReturnType<typeof useHomeModel>, { status: "ready" }>["home"];
}) {
  const badge = BADGE[model.badgeTone];

  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/55 uppercase">
          {model.cycleLabel} · Día {model.cycleDay} / {model.cycleTotal}
        </Text>
        <View className="flex-row items-center gap-3">
          <View
            className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${badge.wrap}`}
          >
            <View className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            <Text className={`font-hanken-semibold text-[12px] ${badge.text}`}>
              {model.badgeLabel}
            </Text>
          </View>
          <SignOutButton />
        </View>
      </View>

      <View className="gap-3">
        <SectionLabel>Puedes gastar hoy</SectionLabel>
        <View className="pt-1">
          <Money cents={model.dailyCents} symbol={model.currencySymbol} />
        </View>
        <Text className="font-hanken text-[14px] text-foreground/55 -mt-1">
          {model.heroSubtitle}
        </Text>
        <View className="pt-1 gap-1.5">
          <View
            className={`h-0.75 w-full rounded-full ${TRACK} overflow-hidden`}
          >
            <View
              className="h-full rounded-full bg-stable"
              style={{ width: `${model.cycleProgress}%` }}
            />
          </View>
          <View className="flex-row items-center justify-between">
            <Text
              className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/55 uppercase"
              selectable
            >
              {model.daysLeft} días restantes
            </Text>
            <Text
              className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/55 uppercase"
              selectable
            >
              {formatCents(model.envelopesBalanceCents, model.currencySymbol)}{" "}
              en sobres
            </Text>
          </View>
        </View>
      </View>

      <Divider />

      <View className="gap-4">
        <SectionLabel>Tus sobres</SectionLabel>
        <EnvelopeRows rows={model.envelopes} symbol={model.currencySymbol} />
      </View>

      {model.coachMessage ? (
        <View className="flex-row gap-3 pt-1">
          <View className="w-0.5 rounded-full bg-stable" />
          <Text
            className="flex-1 font-newsreader text-[20px] leading-6.5 text-foreground"
            selectable
          >
            {model.coachMessage}
          </Text>
        </View>
      ) : null}

      <Divider />

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <SectionLabel>Hoy</SectionLabel>
          <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/55 uppercase">
            {model.todayMovements.length} movimientos
          </Text>
        </View>
        {model.todayMovements.length === 0 ? (
          <StatusCopy>Sin movimientos hoy.</StatusCopy>
        ) : (
          model.todayMovements.map((movement) => (
            <View key={movement.id} className="flex-row items-center gap-3">
              <View
                className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[movement.tone]}`}
              />
              <Text className="flex-1 font-hanken-semibold text-[15px] text-foreground">
                {movement.name}
              </Text>
              <Text
                className="font-hanken-semibold text-[15px] text-foreground"
                selectable
              >
                {movement.tone === "income" ? "+" : "–"}{" "}
                {formatCents(movement.amountCents, model.currencySymbol)}
              </Text>
            </View>
          ))
        )}
      </View>
    </>
  );
}
