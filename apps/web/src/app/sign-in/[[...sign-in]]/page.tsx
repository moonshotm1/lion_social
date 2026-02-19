import { SignIn } from "@clerk/nextjs";
import { Crown } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lion-black px-4 -my-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lion-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lion-gold/3 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-lg">
          <Crown className="w-8 h-8 text-lion-black" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-wider text-gold-gradient">
            THE LION
          </h1>
          <p className="text-sm text-lion-gray-3 mt-1">
            Welcome back, champion
          </p>
        </div>
      </div>

      {/* Clerk Sign In */}
      <div className="relative z-10">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-lion-dark-1 border border-lion-gold/10 shadow-dark-lg",
              headerTitle: "text-lion-white",
              headerSubtitle: "text-lion-gray-3",
              socialButtonsBlockButton:
                "bg-lion-dark-2 border-lion-gold/10 text-lion-white hover:bg-lion-dark-3",
              formFieldLabel: "text-lion-gray-4",
              formFieldInput:
                "bg-lion-dark-2 border-lion-gold/10 text-lion-white",
              formButtonPrimary:
                "bg-gold-gradient hover:shadow-gold-md text-lion-black font-semibold",
              footerActionLink: "text-lion-gold hover:text-lion-gold-light",
              dividerLine: "bg-lion-gold/10",
              dividerText: "text-lion-gray-3",
            },
          }}
        />
      </div>
    </div>
  );
}
