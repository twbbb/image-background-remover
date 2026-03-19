"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  UseCasesSection,
  FAQSection,
  CTASection,
} from "@/components/home";
import type { MattingMode } from "@/lib/types";

export default function Home() {
  const router = useRouter();

  const handleFileSelected = useCallback(
    (file: File, mode: MattingMode) => {
      // Use a global variable to pass file (avoid sessionStorage quota limit)
      (window as any).__bgremover_pending_file = file;
      sessionStorage.setItem("bgremover_mode", mode);
      router.push("/editor");
    },
    [router]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection onFileSelected={handleFileSelected} />
        <FeaturesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <FAQSection />
        <CTASection onFileSelected={handleFileSelected} />
      </main>
      <Footer />
    </div>
  );
}
