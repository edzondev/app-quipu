import Link from "next/link";
import { cn } from "@/shared/lib/utils";

function recoverPasswordHref(email?: string) {
	const trimmed = email?.trim() ?? "";
	return trimmed ? `/recuperar?email=${encodeURIComponent(trimmed)}` : "/recuperar";
}

export function RecoverPasswordLink({
	email = "",
	className,
}: {
	email?: string;
	className?: string;
}) {
	return (
		<Link
			href={recoverPasswordHref(email)}
			className={cn("text-[13px] font-medium text-qp-deep hover:underline", className)}
		>
			Olvidé mi contraseña
		</Link>
	);
}
