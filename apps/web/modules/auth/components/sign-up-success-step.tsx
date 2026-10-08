import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { Check } from "reicon-react/icons/Check";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { authPrimaryButtonClass } from "../constants";

export function SuccessStep({ onContinue }: { onContinue: VoidFunction }) {
	return (
		<div className="flex flex-col items-center text-center">
			<div className="mb-7 flex size-[88px] items-center justify-center rounded-full bg-qp shadow-glow">
				<Check size={36} color="var(--qp-canvas)" strokeWidth={3} aria-hidden />
			</div>
			<h1 className="font-serif font-medium text-[32px] text-ink">Tu cuenta está lista</h1>
			<p className="mt-2.5 max-w-[380px] text-[15px] text-mute leading-[1.55]">
				Empecemos por ordenar tu sistema. En unos pasos sabrás exactamente cuánto puedes gastar.
			</p>
			<Button
				type="button"
				onClick={onContinue}
				className={cn(authPrimaryButtonClass, "mt-[30px] w-auto gap-2 px-[30px]")}
			>
				Ir al onboarding
				<ArrowRight size={20} color="currentColor" />
			</Button>
		</div>
	);
}
