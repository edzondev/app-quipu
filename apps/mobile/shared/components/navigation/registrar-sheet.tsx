import { BottomSheet, RNHostView } from "@expo/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ExpenseSheetForm } from "@/shared/components/expenses/expense-sheet-form";
import { useHomeModel } from "@/shared/hooks/use-dashboard";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import type { ExpenseDraftInput } from "@/shared/lib/expenses/draft";
import { ExpenseValidationError } from "@/shared/lib/expenses/draft";
import { readActionError } from "@/shared/lib/expenses/errors";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

type Session = {
  nonce: number;
};

type Props = {
  isPresented: boolean;
  session: Session;
  onDismiss: () => void;
};

export default function RegistrarSheet({
  isPresented,
  session,
  onDismiss,
}: Props) {
  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={["full"]}
      contentPadding={0}
      containerColor="#FBFAF7"
    >
      <RNHostView>
        <SheetBody key={session.nonce} onDone={onDismiss} />
      </RNHostView>
    </BottomSheet>
  );
}

function SheetBody({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { register } = useExpenseActions();
  const home = useHomeModel();
  const { profile } = useProfileGate();
  const [fieldError, setFieldError] = useState<{
    field: ExpenseValidationError["field"];
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const currencySymbol =
    home.status === "ready"
      ? home.home.currencySymbol
      : (marketFromCurrencyCode(
          profile && typeof profile.currencyCode === "string"
            ? profile.currencyCode
            : "",
        )?.currencySymbol ?? "S/");
  const dailyCents = home.status === "ready" ? home.home.dailyCents : null;

  async function submit(input: ExpenseDraftInput) {
    setFieldError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await register(input);
      onDone();
    } catch (error) {
      if (error instanceof ExpenseValidationError) {
        setFieldError({ field: error.field, message: error.message });
      } else {
        setFormError(readActionError(error, "No se pudo guardar el gasto."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openDetail(input: ExpenseDraftInput) {
    const query = new URLSearchParams({
      amountRaw: input.amountRaw,
      description: input.description,
      envelopeType: input.envelopeType ?? "",
    });
    onDone();
    router.push(`/expense/new?${query.toString()}`);
  }

  return (
    <ExpenseSheetForm
      currencySymbol={currencySymbol}
      dailyCents={dailyCents}
      fieldError={fieldError}
      formError={formError}
      isSubmitting={isSubmitting}
      onSubmit={(input) => {
        void submit(input);
      }}
      onCancel={onDone}
      onOpenDetail={openDetail}
    />
  );
}
