import "./globals.css";

import { SolanaProvider } from "@/components/solana/solana-provider";
import { UiLayout } from "@/components/ui/ui-layout";

import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/components/providers/session-provider";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Solana Blink",
  description: "Solana Blink",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          outfit.className
        )}
        style={{
          fontFamily: "var(--font-outfit), system-ui, sans-serif",
        }}
      >
        <SessionProvider>
          <SolanaProvider>
            <UiLayout>{children}</UiLayout>
          </SolanaProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
