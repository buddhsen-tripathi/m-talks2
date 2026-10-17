import { useCallback, useSyncExternalStore } from "react";
import {
	THEME_CHANGE_EVENT,
	THEME_STORAGE_KEY,
	type Theme,
} from "#/lib/theme.ts";

const media = () => window.matchMedia("(prefers-color-scheme: dark)");

function readTheme(): Theme {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === "light" || stored === "dark") return stored;
	} catch {}
	return "system";
}

function applyTheme(theme: Theme) {
	const dark = theme === "dark" || (theme === "system" && media().matches);
	document.documentElement.classList.toggle("dark", dark);
}

function subscribe(callback: () => void) {
	const onSystemChange = () => {
		if (readTheme() === "system") applyTheme("system");
		callback();
	};
	const mql = media();
	mql.addEventListener("change", onSystemChange);
	window.addEventListener(THEME_CHANGE_EVENT, callback);
	window.addEventListener("storage", callback);
	return () => {
		mql.removeEventListener("change", onSystemChange);
		window.removeEventListener(THEME_CHANGE_EVENT, callback);
		window.removeEventListener("storage", callback);
	};
}

/** Theme preference plus the resolved light/dark mode, synced across tabs. */
export function useTheme() {
	const theme = useSyncExternalStore(subscribe, readTheme, () => "system");
	const resolvedTheme = useSyncExternalStore(
		subscribe,
		() =>
			document.documentElement.classList.contains("dark") ? "dark" : "light",
		() => "light",
	) as "light" | "dark";

	const setTheme = useCallback((next: Theme) => {
		try {
			if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
			else localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {}
		applyTheme(next);
		window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
	}, []);

	const toggleTheme = useCallback(
		() => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
		[resolvedTheme, setTheme],
	);

	return { theme, resolvedTheme, setTheme, toggleTheme };
}
