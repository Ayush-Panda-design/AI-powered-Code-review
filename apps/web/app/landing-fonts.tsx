import { JetBrains_Mono, VT323 } from "next/font/google";

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-landing",
});

export const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-landing",
});
