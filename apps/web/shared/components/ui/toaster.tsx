import { Check } from "reicon-react/icons/Check";
import { CloseCircle } from "reicon-react/icons/CloseCircle";
import { Toaster } from "sonner";

export function AppToaster() {
	return (
		<Toaster
			position="top-center"
			toastOptions={{
				duration: 3000,
				style: {
					background: "var(--color-surface)",
					color: "var(--color-ink)",
					border: "1px solid var(--color-line)",
					borderRadius: "11px",
					fontSize: "14px",
					fontFamily: "var(--font-sans)",
					boxShadow: "0 8px 24px rgba(35,32,28,0.12)",
				},
			}}
			icons={{
				success: (
					<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-qp">
						<Check size={10} color="white" strokeWidth={3} aria-hidden />
					</span>
				),
				error: (
					<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-danger">
						<CloseCircle size={14} color="white" weight="Filled" aria-hidden />
					</span>
				),
			}}
		/>
	);
}
