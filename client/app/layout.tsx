import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/providers/store-provider";
import { SessionValidator } from "@/components/auth/session-validator";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SeatMaster",
  description: "Event seating management: create events, invite guests, manage tables and seats, and handle RSVPs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <StoreProvider>
          <SessionValidator />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
