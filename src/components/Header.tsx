"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            BG<span className="gradient-text">Remover</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            href="/editor"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Editor
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </nav>

        <Link
          href="/editor"
          className="rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
        >
          Try Free
        </Link>
      </div>
    </header>
  );
}
