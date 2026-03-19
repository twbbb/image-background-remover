"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadZone from "@/components/UploadZone";
import {
  Zap,
  Shield,
  Layers,
  Download,
  ImageIcon,
  Sparkles,
  Monitor,
  ChevronDown,
  Star,
  ShoppingCart,
  User,
  Camera,
  ShoppingBag,
} from "lucide-react";

// ============ Hero Section ============
type MattingMode = "portrait" | "goods" | "general";

const MATTING_TABS: {
  mode: MattingMode;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    mode: "portrait",
    label: "Portrait",
    icon: User,
    description: "Best for people & faces",
  },
  {
    mode: "goods",
    label: "Product",
    icon: ShoppingBag,
    description: "Best for products & goods",
  },
  {
    mode: "general",
    label: "General",
    icon: Layers,
    description: "Works for any subject",
  },
];

function HeroSection({
  onFileSelected,
}: {
  onFileSelected: (file: File, mode: MattingMode) => void;
}) {
  const [mattingMode, setMattingMode] = React.useState<MattingMode>("portrait");

  const handleFileSelect = (file: File) => {
    onFileSelected(file, mattingMode);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 fade-in">
            <Sparkles className="h-4 w-4" />
            100% Free • No Signup Required
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl fade-in">
            Remove Image Background
            <br />
            <span className="gradient-text">Instantly with AI</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted leading-relaxed fade-in">
            Upload your image and get a clean, transparent background in
            seconds. Powered by AI — works right in your browser. No upload to
            server, 100% private.
          </p>

          {/* Matting Mode Tabs */}
          <div className="mt-8 flex items-center justify-center gap-2 fade-in">
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-secondary/50 border border-border">
              {MATTING_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = mattingMode === tab.mode;
                return (
                  <button
                    key={tab.mode}
                    onClick={() => setMattingMode(tab.mode)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white dark:bg-card shadow-md text-primary border border-border/50"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode description */}
          <p className="mt-3 text-xs text-muted fade-in">
            {MATTING_TABS.find((t) => t.mode === mattingMode)?.description}
          </p>

          {/* Upload zone */}
          <div className="mt-6 fade-in">
            <UploadZone onFileSelected={handleFileSelect} />
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted fade-in">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-500" />
              Privacy First — No Data Uploaded
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />
              Lightning Fast Processing
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-orange-500" />
              HD Quality Output
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ Features Section ============
function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Remove backgrounds in seconds, not minutes. Our AI processes images right in your browser.",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      icon: Shield,
      title: "100% Private",
      description:
        "Your images never leave your device. All processing happens locally in your browser.",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Precision",
      description:
        "Advanced AI model handles complex edges — hair, fur, transparent objects with ease.",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: Monitor,
      title: "Works Everywhere",
      description:
        "No downloads, no installs. Works on any modern browser — desktop, tablet, or mobile.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Layers,
      title: "Background Replace",
      description:
        "Not just removal — add solid colors or custom background images to your photos.",
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Download,
      title: "HD Download",
      description:
        "Download full-resolution PNG images with transparent backgrounds. No quality loss.",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Why Choose <span className="gradient-text">BGRemover</span>?
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            The most powerful free background remover. No watermarks, no limits,
            no signups.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-4`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ Use Cases Section ============
function UseCasesSection() {
  const useCases = [
    {
      icon: ShoppingCart,
      title: "E-Commerce & Product Photos",
      description:
        "Create professional product photos with white or custom backgrounds for Amazon, Shopify, eBay, and more.",
      keywords: "product photo background remover",
    },
    {
      icon: User,
      title: "Portraits & Profile Pictures",
      description:
        "Remove backgrounds from portraits for LinkedIn, resumes, ID photos, and social media profiles.",
      keywords: "portrait background remover",
    },
    {
      icon: Camera,
      title: "Photography & Design",
      description:
        "Quickly isolate subjects from photos for compositing, collages, and graphic design projects.",
      keywords: "photo background eraser",
    },
    {
      icon: ImageIcon,
      title: "Social Media Content",
      description:
        "Create eye-catching social media posts with transparent or custom backgrounds for Instagram, TikTok, and more.",
      keywords: "transparent background maker",
    },
  ];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Perfect for Every Use Case
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            From e-commerce to social media — remove backgrounds for any
            purpose.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {useCases.map((uc) => (
            <div
              key={uc.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <uc.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{uc.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {uc.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ How It Works Section ============
function HowItWorksSection() {
  const steps = [
    {
      step: "1",
      title: "Upload Your Image",
      description:
        "Drag & drop or click to upload any PNG, JPG, or WebP image.",
    },
    {
      step: "2",
      title: "AI Removes Background",
      description:
        "Our AI model processes the image right in your browser — fast and private.",
    },
    {
      step: "3",
      title: "Download Result",
      description:
        "Get a transparent PNG or choose a new background color. Download in full HD.",
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            How to Remove Background from Image
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            Three simple steps to remove any image background — completely free.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white text-xl font-bold mb-4">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FAQ Section ============
function FAQSection() {
  const faqs = [
    {
      q: "Is this background remover really free?",
      a: "Yes! BGRemover is 100% free with no watermarks, no signup required, and no hidden fees. All processing happens in your browser.",
    },
    {
      q: "Is my image uploaded to any server?",
      a: "No. Your images are processed entirely in your browser using AI. Nothing is uploaded to any server — your privacy is fully protected.",
    },
    {
      q: "What image formats are supported?",
      a: "We support PNG, JPG/JPEG, WebP, and BMP formats. The output is always a high-quality PNG with transparency.",
    },
    {
      q: "How does the AI background removal work?",
      a: "We use a state-of-the-art machine learning model that runs directly in your browser. It detects the foreground subject and precisely removes the background, even handling complex edges like hair and fur.",
    },
    {
      q: "Is there a file size limit?",
      a: "Images up to 20MB are supported. For best performance, we recommend images under 10MB.",
    },
    {
      q: "Can I replace the background with a custom color or image?",
      a: "Yes! After removing the background, you can choose a solid color background or upload a custom background image in our editor.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-card-hover transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span className="font-medium pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4 text-sm text-muted leading-relaxed fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ CTA Section ============
function CTASection({
  onFileSelected,
}: {
  onFileSelected: (file: File, mode: MattingMode) => void;
}) {
  const [mattingMode, setMattingMode] = React.useState<MattingMode>("portrait");

  const handleFileSelect = (file: File) => {
    onFileSelected(file, mattingMode);
  };

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl mb-4">
          Ready to Remove Your Image Background?
        </h2>
        <p className="text-muted mb-8 max-w-xl mx-auto">
          It takes just seconds. No signup, no watermark, no limits. Try it now
          — completely free.
        </p>

        {/* Matting Mode Tabs */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-secondary/50 border border-border">
            {MATTING_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = mattingMode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  onClick={() => setMattingMode(tab.mode)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white dark:bg-card shadow-md text-primary border border-border/50"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode description */}
        <p className="text-xs text-muted mb-4">
          {MATTING_TABS.find((t) => t.mode === mattingMode)?.description}
        </p>

        <UploadZone onFileSelected={handleFileSelect} />
      </div>
    </section>
  );
}

// ============ Main Page ============
export default function Home() {
  const router = useRouter();

  const handleFileSelected = useCallback(
    (file: File, mode: MattingMode) => {
      // Store file and mode in sessionStorage for the editor page
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
