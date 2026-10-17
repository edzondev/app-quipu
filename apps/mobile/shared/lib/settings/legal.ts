import * as Linking from "expo-linking";

export const LEGAL_PRIVACY_URL = "https://quipu-finance.app/privacidad";
export const LEGAL_TERMS_URL = "https://quipu-finance.app/terminos";

export function openLegalUrl(url: string) {
	return Linking.openURL(url);
}
