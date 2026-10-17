export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "theme-change";

/**
 * Runs in <head> before paint so the first frame already has the right
 * `.dark` class. Kept dependency-free because it is inlined as a string.
 */
export const themeBootstrapScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;
