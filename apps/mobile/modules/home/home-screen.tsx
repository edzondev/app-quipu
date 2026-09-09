import { cn } from "cn";
import { Pressable, ScrollView, Text, View } from "react-native";
import SignOutButton from "@/shared/components/auth/sign-out-button";
import { Money } from "@/shared/components/money/money";
import type { HomeTone, HomeView, StatusBadge } from "./types";

type Props = {
  view: HomeView;
  onRegisterIncome: () => void;
  onReviewAllocations: () => void;
  onSeeEnvelopes: () => void;
};

const TONE_DOT: Record<HomeTone, string> = {
  needs: "bg-needs",
  wants: "bg-wants",
  savings: "bg-savings",
};

const TONE_BAR: Record<HomeTone, string> = {
  needs: "bg-needs",
  wants: "bg-wants",
  savings: "bg-savings",
};

const BADGE_PILL: Record<StatusBadge, string> = {
  stable: "bg-stable/15",
  attention: "bg-warning/15",
  risk: "bg-danger/15",
  starting: "bg-stable/15",
};

const BADGE_DOT: Record<StatusBadge, string> = {
  stable: "bg-stable",
  attention: "bg-warning",
  risk: "bg-danger",
  starting: "bg-stable",
};

const BADGE_TEXT: Record<StatusBadge, string> = {
  stable: "text-stable",
  attention: "text-warning",
  risk: "text-danger",
  starting: "text-stable",
};

const TRACK = "bg-[#E8E6DF]";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
      {children}
    </Text>
  );
}

function Divider() {
  return <View className="h-px w-full bg-[#E8E6DF]" />;
}

function StatusPill({ label, tone }: { label: string; tone: StatusBadge }) {
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${BADGE_PILL[tone]}`}
    >
      <View className={`h-1.5 w-1.5 rounded-full ${BADGE_DOT[tone]}`} />
      <Text className={`font-hanken-semibold text-[12px] ${BADGE_TEXT[tone]}`}>
        {label}
      </Text>
    </View>
  );
}

function EmptyState({
  title,
  hint,
  onRegisterIncome,
  onReviewAllocations,
}: {
  title: string;
  hint: string;
  onRegisterIncome: () => void;
  onReviewAllocations: () => void;
}) {
  return (
    <View className="gap-4">
      <Text className="font-newsreader text-[24px] text-foreground">
        {title}
      </Text>
      <Text className="font-hanken text-[14px] text-foreground/55">{hint}</Text>
      <View className="gap-3 pt-2">
        <Pressable
          accessibilityRole="button"
          onPress={onRegisterIncome}
          className="h-14 items-center justify-center rounded-full bg-foreground"
        >
          <Text className="font-hanken-semibold text-[16px] text-background">
            Registrar mi ingreso
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onReviewAllocations}
          hitSlop={8}
          className="items-center py-1"
        >
          <Text className="font-hanken text-[14px] text-foreground/45">
            Revisar mis porcentajes
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function HomeScreen({
  view,
  onRegisterIncome,
  onReviewAllocations,
  onSeeEnvelopes,
}: Props) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="pb-12 gap-8"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-geist-mono text-[10.5px] tracking-widest text-foreground/55 uppercase">
          {view.cycleLabel}
        </Text>
        <View className="flex-row items-center gap-3">
          {view.kind === "active" ? (
            <StatusPill label={view.badge.label} tone={view.badge.tone} />
          ) : null}
          <SignOutButton />
        </View>
      </View>

      {view.kind === "empty" ? (
        <EmptyState
          title={view.title}
          hint={view.heroHint}
          onRegisterIncome={onRegisterIncome}
          onReviewAllocations={onReviewAllocations}
        />
      ) : (
        <>
          <View className="gap-3">
            <SectionLabel>Tu ritmo diario</SectionLabel>
            <View className="pt-1">
              <Money
                cents={view.dailyCents}
                size="hero"
                alwaysDecimals
                className="font-newsreader text-[64px]"
              />
            </View>
            <Text className="font-hanken text-[14px] text-foreground/55 -mt-1">
              {view.heroHint}
            </Text>
            <View className="pt-1 gap-1.5">
              <View
                className={`h-0.75 w-full rounded-full ${TRACK} overflow-hidden`}
              >
                <View
                  className="h-full rounded-full bg-stable"
                  style={{ width: `${view.cycleProgress}%` }}
                />
              </View>
              <View className="flex-row items-center justify-between mt-0.5">
                <Text
                  className="font-geist-mono text-[10.5px] tracking-wide text-foreground/55"
                  selectable
                >
                  {view.daysRemainingLabel}
                </Text>
                <View className="flex-row items-baseline">
                  <Money
                    cents={view.envelopesTotalCents}
                    className="font-geist-mono text-[12px] tracking-wide"
                  />
                  <Text className="font-geist-mono text-[12px] tracking-wide text-foreground/55">
                    {" en sobres"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Divider />

          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <SectionLabel>Tus sobres</SectionLabel>
              <Pressable onPress={onSeeEnvelopes} hitSlop={8}>
                <Text className="font-hanken-semibold text-[14px] text-stable">
                  Ver todos
                </Text>
              </Pressable>
            </View>

            {view.envelopes.map((envelope) => (
              <View key={envelope.type} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-baseline gap-2">
                    <Text className="font-hanken-semibold text-[15px] text-foreground">
                      {envelope.label}
                    </Text>
                  </View>
                  <View className="flex-row items-baseline">
                    <Money
                      cents={envelope.cents}
                      className="font-hanken text-sm"
                    />
                    <Text className="font-hanken text-sm text-foreground/45">
                      {" "}
                      {envelope.suffix}
                    </Text>
                  </View>
                </View>
                <View
                  className={`h-0.75 w-full rounded-full ${TRACK} overflow-hidden`}
                >
                  <View
                    className={`h-full rounded-full ${TONE_BAR[envelope.type]}`}
                    style={{ width: `${envelope.progress}%` }}
                  />
                </View>
              </View>
            ))}
          </View>

          <View className="flex-row gap-3 pt-1">
            <View className="w-0.5 rounded-full bg-stable" />
            <View className="flex-1 gap-3">
              <Text
                className="font-newsreader text-[20px] leading-6.5 text-foreground"
                selectable
              >
                {view.coachMessage}
              </Text>
            </View>
          </View>

          {view.movements.length > 0 ? (
            <>
              <Divider />
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <SectionLabel>Hoy</SectionLabel>
                  <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/55 uppercase">
                    {view.movements.length} movimientos
                  </Text>
                </View>
                {view.movements.map((movement) => (
                  <View
                    key={movement.id}
                    className="flex-row items-center gap-3 pb-2.5 border-b border-line"
                  >
                    <View
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        TONE_DOT[movement.envelopeType],
                      )}
                    />
                    <Text className="flex-1 font-hanken-semibold text-[15px] text-foreground">
                      {movement.name}
                    </Text>
                    <Money
                      cents={movement.cents}
                      sign="auto"
                      tone={movement.kind}
                      alwaysDecimals
                      className="font-hanken-semibold text-[15px]"
                    />
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
