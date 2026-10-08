// hooks/use-passkey-support.ts — versión corregida
"use client";
import { useEffect, useState } from "react";

export function usePasskeySupport() {
	const [support, setSupport] = useState({
		webauthn: false, // soporte básico → gate del botón
		conditionalUI: false, // para el autofill
	});

	useEffect(() => {
		let cancelled = false;
		async function check() {
			if (typeof window === "undefined" || !window.PublicKeyCredential) return;

			const webauthn = true; // si llegamos aquí, la API existe
			let conditionalUI = false;
			try {
				if (PublicKeyCredential.isConditionalMediationAvailable) {
					conditionalUI = await PublicKeyCredential.isConditionalMediationAvailable();
				}
			} catch {}

			if (!cancelled) setSupport({ webauthn, conditionalUI });
		}
		void check();
		return () => {
			cancelled = true;
		};
	}, []);

	return support;
}
