import { absoluteUrl, siteConfig } from "@/core/seo";
import { JsonLdScript } from "@/shared/components/seo/json-ld-script";

export function SiteJsonLd() {
	const url = absoluteUrl("/");

	const organization = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: siteConfig.name,
		url,
		description: siteConfig.description,
		logo: absoluteUrl("/icon"),
	};

	const webApplication = {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: siteConfig.name,
		url,
		applicationCategory: "FinanceApplication",
		operatingSystem: "Web",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "PEN",
		},
		inLanguage: siteConfig.language,
		description: siteConfig.description,
	};

	return (
		<>
			<JsonLdScript data={organization} />
			<JsonLdScript data={webApplication} />
		</>
	);
}
