/** Google Fonts available in the invitation workspace. */
export const INVITATION_FONTS = [
  { family: "DM Sans", label: "DM Sans", weights: "400;500;600;700" },
  { family: "Fraunces", label: "Fraunces", weights: "400;500;600;700" },
  { family: "Playfair Display", label: "Playfair Display", weights: "400;500;600;700" },
  { family: "Cormorant Garamond", label: "Cormorant Garamond", weights: "400;500;600;700" },
  { family: "Great Vibes", label: "Great Vibes", weights: "400" },
  { family: "Dancing Script", label: "Dancing Script", weights: "400;500;600;700" },
  { family: "Pacifico", label: "Pacifico", weights: "400" },
  { family: "Parisienne", label: "Parisienne", weights: "400" },
  { family: "Montserrat", label: "Montserrat", weights: "300;400;500;600;700" },
  { family: "Poppins", label: "Poppins", weights: "300;400;500;600;700" },
  { family: "Raleway", label: "Raleway", weights: "300;400;500;600;700" },
  { family: "Lora", label: "Lora", weights: "400;500;600;700" },
  { family: "Merriweather", label: "Merriweather", weights: "300;400;700" },
  { family: "Oswald", label: "Oswald", weights: "300;400;500;600;700" },
  { family: "Roboto Slab", label: "Roboto Slab", weights: "300;400;500;600;700" },
  { family: "Josefin Sans", label: "Josefin Sans", weights: "300;400;500;600;700" },
  { family: "Quicksand", label: "Quicksand", weights: "300;400;500;600;700" },
  { family: "Caveat", label: "Caveat", weights: "400;500;600;700" },
  { family: "Satisfy", label: "Satisfy", weights: "400" },
  { family: "Cinzel", label: "Cinzel", weights: "400;500;600;700" },
  { family: "Georgia", label: "Georgia (system)", weights: "", system: true },
  { family: "Times New Roman", label: "Times New Roman", weights: "", system: true },
  { family: "Arial", label: "Arial", weights: "", system: true },
  { family: "Courier New", label: "Courier New", weights: "", system: true },
] as const;

let fontsPromise: Promise<void> | null = null;

export function ensureInvitationFontsLoaded(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (fontsPromise) return fontsPromise;

  fontsPromise = (async () => {
    const google = INVITATION_FONTS.filter((f) => !("system" in f && f.system));
    const families = google
      .map((f) => `family=${encodeURIComponent(f.family)}:wght@${f.weights}`)
      .join("&");
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    if (!document.querySelector(`link[data-invitation-fonts="1"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-invitation-fonts", "1");
      document.head.appendChild(link);
    }
    const load = Promise.all(
      google.map(async (f) => {
        try {
          await document.fonts.load(`400 16px "${f.family}"`);
        } catch {
          /* ignore */
        }
      })
    );
    // Don't hang the studio if fonts are slow/offline
    await Promise.race([
      load,
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
  })();

  return fontsPromise;
}
