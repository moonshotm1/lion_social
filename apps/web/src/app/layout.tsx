import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import "./globals.css";

// Clerk — uncomment once API keys are configured
// import { ClerkProvider } from "@clerk/nextjs";
// import { dark } from "@clerk/themes";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
  openGraph: {
    title: "Gains | Wellness Social",
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
  );
}
