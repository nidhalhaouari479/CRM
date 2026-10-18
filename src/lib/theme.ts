export const THEME_STORAGE_KEY = "crm-theme";

/** Runs before first paint (root layout) so the saved theme never flashes. */
export const themeInitScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
