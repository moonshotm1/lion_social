import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LionLogo } from "@/components/ui/lion-logo";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Gains | Wellness Social",
  description:
    "Elevate your wellness journey. Share workouts, meals, and motivation with a community that pushes you to be your best.",
  keywords: [
    "wellness",
    "fitness",
    "social",
    "workout",
    "motivation",
    "health",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gains",
  },
  openGraph: {
    title: "Gains | Wellness Social",
    description:
      "Elevate your wellness journey. Share workouts, meals, and motivation with a community that pushes you to be your best.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0D0D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${dmSans.variable} ${playfair.variable}`}>
      <body className="bg-lion-black text-lion-white font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
              {/* Mobile header — visible only below lg breakpoint */}
              <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-2.5 safe-area-pt bg-lion-dark-1/95 backdrop-blur-xl border-b border-lion-dark-4">
                <LionLogo size={36} withBackground className="rounded-xl flex-shrink-0" />
                <span
                  className="text-xl font-bold text-gold-gradient tracking-wide"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  GAINS
                </span>
              </div>
              <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
            </main>
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
