import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Lion | Wellness Social",
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
  openGraph: {
    title: "The Lion | Wellness Social",
    description:
      "Elevate your wellness journey. Share workouts, meals, and motivation with a community that pushes you to be your best.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#D4A843",
          colorBackground: "#111111",
          colorInputBackground: "#1A1A1A",
          colorInputText: "#F5F5F5",
          colorText: "#F5F5F5",
          colorTextSecondary: "#888888",
          borderRadius: "12px",
        },
        elements: {
          card: "bg-lion-dark-1 border border-lion-gold/10",
          formButtonPrimary: "btn-gold",
        },
      }}
    >
      <html lang="en" className={`dark ${inter.variable}`}>
        <body className="bg-lion-black text-lion-white font-sans antialiased">
          <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
              <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileNav />
        </body>
      </html>
    </ClerkProvider>
  );
}
