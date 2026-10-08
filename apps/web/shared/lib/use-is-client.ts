import { useSyncExternalStore } from "react";

/** Client-only gate without useEffect/setState (avoids mount flash). */
export function useIsClient() {
	return useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);
}
