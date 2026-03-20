"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, LogIn, LogOut, User, CreditCard, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            href="/pricing"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Pricing
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

        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-surface" />
          ) : session ? (
            // 已登录：头像 + 下拉菜单
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border border-border px-2 py-1.5 transition-all hover:bg-secondary"
              >
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <span className="hidden text-sm font-medium text-foreground sm:inline max-w-[100px] truncate">
                  {session.user?.name}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 下拉菜单 */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg py-1 z-50 fade-in">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium truncate">{session.user?.name}</p>
                    <p className="text-xs text-muted truncate">{session.user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Account
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pricing
                  </Link>
                  <div className="border-t border-border">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50/50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 未登录：显示登录按钮
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in
            </button>
          )}

          <Link
            href="/editor"
            className="rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
          >
            Try Free
          </Link>
        </div>
      </div>
    </header>
  );
}
