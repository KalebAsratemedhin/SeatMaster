"use client";
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: React.PropsWithChildren<ThemeProviderProps>) {
  return (
    <NextThemesProvider
      attribute="class" // Crucial: adds 'dark'/'light' class to <html>
      defaultTheme="system" // Uses OS preference as default
      enableSystem // Allows choosing the "system" option
      disableTransitionOnChange // Prevents flickering on change
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}