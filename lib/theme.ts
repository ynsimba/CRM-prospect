export const THEME_STORAGE_KEY = "safecheck-theme";
export const THEME_CLASS = "theme-dim";

export type ThemeName = "light" | "dark";

export function resolveTheme(stored: string | null | undefined, prefersDark: boolean): ThemeName {
  if (stored === "dark" || stored === "light") return stored;
  return prefersDark ? "dark" : "light";
}

export function applyThemeClass(
  theme: ThemeName,
  root: { classList: { toggle: (token: string, force?: boolean) => unknown } },
) {
  root.classList.toggle(THEME_CLASS, theme === "dark");
}

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("${THEME_CLASS}",d);}catch(e){}})();`;
