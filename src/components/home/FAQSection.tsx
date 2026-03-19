"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

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

export default function FAQSection() {
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
