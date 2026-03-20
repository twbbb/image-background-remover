"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  User,
  Mail,
  Calendar,
  BarChart3,
  Crown,
  ArrowRight,
  Loader2,
  ImageIcon,
  TrendingUp,
} from "lucide-react";
import type { UserProfile, UsageInfo } from "@/lib/types";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("google");
      return;
    }

    if (status === "authenticated") {
      fetch("/api/user")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data.profile);
          setUsage(data.usage);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!session || !profile || !usage) {
    return null;
  }

  const usagePercent = Math.min(
    100,
    Math.round((usage.todayUsed / usage.dailyLimit) * 100)
  );

  const planColors: Record<string, string> = {
    free: "from-gray-500 to-gray-600",
    pro: "from-primary to-accent",
    business: "from-purple-500 to-pink-500",
  };

  const planNames: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 用户信息卡 */}
          <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
            <div className="flex items-center gap-4">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-16 w-16 rounded-full border-2 border-primary/30"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                  {profile.name?.charAt(0) || "U"}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {profile.name}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${
                      planColors[profile.plan]
                    } px-3 py-0.5 text-xs font-semibold text-white`}
                  >
                    <Crown className="h-3 w-3" />
                    {planNames[profile.plan]}
                  </span>
                </h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 今日使用情况 */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Today&apos;s Usage</h3>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">
                  {usage.todayUsed} / {usage.dailyLimit} images
                </span>
                <span className="font-semibold">{usagePercent}%</span>
              </div>
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent > 90
                      ? "bg-red-500"
                      : usagePercent > 70
                      ? "bg-yellow-500"
                      : "bg-gradient-to-r from-primary to-accent"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            <p className="text-sm text-muted">
              {usage.remaining > 0 ? (
                <>
                  <span className="font-semibold text-foreground">
                    {usage.remaining}
                  </span>{" "}
                  images remaining today
                </>
              ) : (
                <span className="text-red-500 font-medium">
                  Daily limit reached. Resets tomorrow.
                </span>
              )}
            </p>
          </div>

          {/* 总计统计 */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h3 className="font-semibold">Statistics</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{usage.totalProcessed}</p>
                <p className="text-sm text-muted">Total Processed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{usage.todayUsed}</p>
                <p className="text-sm text-muted">Processed Today</p>
              </div>
            </div>
          </div>

          {/* 套餐管理 */}
          <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Subscription Plan</h3>
                </div>
                <p className="text-sm text-muted">
                  {profile.plan === "free" ? (
                    "You are on the Free plan. Upgrade for more daily images."
                  ) : (
                    <>
                      Your {planNames[profile.plan]} plan is active
                      {profile.planExpiresAt && (
                        <>
                          {" "}until{" "}
                          {new Date(profile.planExpiresAt).toLocaleDateString()}
                        </>
                      )}
                      .
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => router.push("/pricing")}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                {profile.plan === "free" ? "Upgrade" : "Manage Plan"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
