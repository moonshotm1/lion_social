"use client";

import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-lion-gold/10 flex items-center justify-center">
        <MessageCircle className="w-8 h-8 text-lion-gold/60" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-lion-white">Messages coming soon</p>
        <p className="text-xs text-lion-gray-3">Direct messaging will be available here</p>
      </div>
    </div>
  );
}
