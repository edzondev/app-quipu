import { useRouter } from "next/navigation";
import { authClient } from "@/auth/auth-client";
import { AnalyticsEvents, track } from "@/core/analytics";

/** Cierra sesión, trackea el evento y redirige al login. */
export function useSignOut() {
	const router = useRouter();

	return () => {
		void (async () => {
			track(AnalyticsEvents.USER_LOGGED_OUT, {});
			await authClient.signOut();
			router.push("/sign-in");
			router.refresh();
		})();
	};
}
