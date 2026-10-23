/**
 * Helpers for installed-app (PWA standalone) behavior.
 *
 * Rule: when OneStock runs as an installed app (home-screen / "Agregar a inicio"),
 * the landing page ("/") must never be shown. The app opens on /login, or on
 * /app/dashboard when the user already has a session. The landing stays visible
 * in regular browsers (desktop, mobile without install, tablet).
 */

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const matches =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return matches || nav.standalone === true;
}

/** First screen of the installed app: /login, or the workspace if signed in. */
export function standaloneEntryPath(isAuthenticated: boolean): string {
  return isAuthenticated ? "/app/dashboard" : "/login";
}

/** True when the landing route must be blocked because the app is installed. */
export function shouldBlockLanding(isStandalone: boolean, pathname: string): boolean {
  return isStandalone && pathname === "/";
}
