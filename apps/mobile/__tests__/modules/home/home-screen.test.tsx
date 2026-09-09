import { fireEvent, render, screen } from "@testing-library/react-native";
import { HomeScreen } from "@/modules/home/home-screen";
import type { DashboardSummary } from "@/modules/home/types";
import { toHomeView } from "@/modules/home/use-home-summary";

jest.mock("@/lib/auth-client", () => ({
  authClient: { signOut: jest.fn() },
}));

jest.mock("@/shared/components/ui/reicon", () => {
  const { Text } = require("react-native");
  return {
    Plus: () => <Text testID="icon-plus">+</Text>,
    Minus: () => <Text testID="icon-minus">-</Text>,
  };
});

const ALLOC = { needs: 50, wants: 30, savings: 20 };

const onRegisterIncome = jest.fn();
const onReviewAllocations = jest.fn();
const onSeeEnvelopes = jest.fn();

async function renderHome(summary: DashboardSummary | null) {
  return render(
    <HomeScreen
      view={toHomeView(summary, ALLOC)}
      onRegisterIncome={onRegisterIncome}
      onReviewAllocations={onReviewAllocations}
      onSeeEnvelopes={onSeeEnvelopes}
    />,
  );
}

function emptySummary(): DashboardSummary {
  return {
    profile: { name: "Ana", currencyCode: "PEN", plan: "free" },
    cycle: null,
    hero: null,
    envelopes: [],
    commitments: [],
    coach: null,
    movements: [],
    isEarlyCycle: false,
  };
}

function activeSummary(): DashboardSummary {
  return {
    profile: { name: "Ana", currencyCode: "PEN", plan: "free" },
    cycle: {
      id: "c1",
      startDate: Date.parse("2026-08-01T05:00:00.000Z"),
      endDate: Date.parse("2026-08-31T05:00:00.000Z"),
      daysTotal: 30,
      daysRemaining: 15,
      daysElapsed: 15,
      progressPercent: 50,
    },
    hero: {
      dailyAvailableCents: 4230,
      displayDailyCents: 4230,
      statusBadge: "stable",
      spendableCents: 124000,
      reservedCents: 0,
      unallocatedCents: 0,
    },
    liquidity: {
      spendableCents: 124000,
      reservedCents: 0,
      unallocatedCents: 0,
      savingsParkedInEnvelopeCents: 0,
    },
    envelopes: [
      {
        type: "needs",
        remainingAmount: 61200,
        allocatedAmount: 175000,
        percentRemaining: 35,
      },
      {
        type: "wants",
        remainingAmount: 23100,
        allocatedAmount: 105000,
        percentRemaining: 22,
      },
      {
        type: "savings",
        remainingAmount: 70000,
        allocatedAmount: 70000,
        percentRemaining: 100,
      },
    ],
    commitments: [],
    coach: {
      kind: "tranquil",
      message: "Vas bien. Puedes gastar S/ 42 hoy sin tocar tu ahorro.",
    },
    movements: [
      {
        id: "m1",
        kind: "expense",
        label: "Menú del día",
        envelopeLabel: "Gustos",
        amount: 1500,
        timestamp: 1,
      },
    ],
    isEarlyCycle: false,
  };
}

describe("HomeScreen — vacío", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra la invitación simple y nada de dashboard", async () => {
    await renderHome(emptySummary());

    expect(screen.getByText(/sin ciclo activo/i)).toBeTruthy();
    expect(screen.getByText(/empieza con tu primer ingreso/i)).toBeTruthy();
    expect(screen.getByText(/reparte en tus tres sobres/i)).toBeTruthy();
    expect(screen.queryByText("En espera")).toBeNull();
    expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
    expect(screen.queryByText("S/ —")).toBeNull();
    expect(screen.queryByText("Hoy")).toBeNull();
    expect(screen.queryByText("Ver todos")).toBeNull();
  });

  it("Registrar mi ingreso dispara onRegisterIncome", async () => {
    await renderHome(emptySummary());
    fireEvent.press(screen.getByText("Registrar mi ingreso"));
    expect(onRegisterIncome).toHaveBeenCalledTimes(1);
  });

  it("Revisar mis porcentajes dispara onReviewAllocations", async () => {
    await renderHome(emptySummary());
    fireEvent.press(screen.getByText("Revisar mis porcentajes"));
    expect(onReviewAllocations).toHaveBeenCalledTimes(1);
  });
});

describe("HomeScreen — ciclo activo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("pinta cifras reales y oculta los CTAs de vacío", async () => {
    await renderHome(activeSummary());

    expect(screen.getByText(/ciclo · día 15 \/ 30/i)).toBeTruthy();
    expect(screen.getByText("Estable")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText(".30")).toBeTruthy();
    expect(screen.getByText("S/ 612")).toBeTruthy();
    expect(screen.getByText("de 1,750")).toBeTruthy();
    expect(screen.getByText("apartado")).toBeTruthy();
    expect(screen.getByText("Menú del día")).toBeTruthy();
    expect(screen.getByText("S/ 15.00")).toBeTruthy();
    expect(screen.getByTestId("icon-minus")).toBeTruthy();
    expect(screen.queryByText("Registrar mi ingreso")).toBeNull();
    expect(screen.queryByText("Revisar mis porcentajes")).toBeNull();
  });

  it("Ver todos dispara onSeeEnvelopes", async () => {
    await renderHome(activeSummary());
    fireEvent.press(screen.getByText("Ver todos"));
    expect(onSeeEnvelopes).toHaveBeenCalledTimes(1);
  });
});
