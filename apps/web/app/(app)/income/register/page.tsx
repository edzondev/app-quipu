import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { IncomeRegisterFlow } from "@/modules/income/components/income-register-flow";

export const metadata = pageMetadata({
	title: "Registrar ingreso",
	path: "/income/register",
});

export default async function IncomeRegisterPage() {
	const profile = await requireOnboardedProfile();

	return <IncomeRegisterFlow profile={profile} currencyCode={profile.currencyCode} />;
}
