"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">
                BG<span className="gradient-text">Remover</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm text-muted leading-relaxed">
              Free AI-powered image background remover. Remove backgrounds from
              photos instantly — no signup, no watermarks. Perfect for product
              photos, portraits, and more.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Tools
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/editor"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Background Remover
                </Link>
              </li>
              <li>
                <Link
                  href="/editor"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Background Changer
                </Link>
              </li>
              <li>
                <Link
                  href="/editor"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Batch Processing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} BGRemover. All rights reserved.
            Powered by AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
