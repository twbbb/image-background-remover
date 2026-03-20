"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Check, Zap, Crown, Rocket, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface PlanCard {
  name: string;
  type: string;
  price: number;
  dailyLimit: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  gradient: string;
  buttonStyle: string;
}

const plans: PlanCard[] = [
  {
    name: "Free",
    type: "free",
    price: 0,
    dailyLimit: "30",
    icon: <Zap className="h-6 w-6" />,
    gradient: "from-gray-500 to-gray-600",
    buttonStyle:
      "border border-border text-foreground hover:bg-secondary",
    features: [
      "30 images per day",
      "Standard quality",
      "Portrait & General mode",
      "PNG download",
      "Community support",
    ],
  },
  {
    name: "Pro",
    type: "pro",
    price: 1,
    dailyLimit: "300",
    popular: true,
    icon: <Crown className="h-6 w-6" />,
    gradient: "from-primary to-accent",
    buttonStyle:
      "bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg",
    features: [
      "300 images per day",
      "High quality output",
      "All matting modes",
      "PNG download",
      "No watermark",
      "Priority processing",
      "Email support",
    ],
  },
  {
    name: "Business",
    type: "business",
    price: 10,
    dailyLimit: "3,000",
    icon: <Rocket className="h-6 w-6" />,
    gradient: "from-purple-500 to-pink-500",
    buttonStyle:
      "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg",
    features: [
      "3,000 images per day",
      "Maximum quality output",
      "All matting modes",
      "PNG & SVG download",
      "No watermark",
      "Batch processing",
      "API access",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetch("/api/user")
        .then((res) => res.json())
        .then((data) => {
          if (data.profile?.plan) {
            setCurrentPlan(data.profile.plan);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  const handleSubscribe = async (planType: string) => {
    if (planType === "free" || planType === currentPlan) return;

    if (!session) {
      // 未登录，提示先登录
      const { signIn } = await import("next-auth/react");
      signIn("google");
      return;
    }

    setLoadingPlan(planType);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planType }),
      });
      const data = await res.json();

      if (data.approvalUrl) {
        // 跳转到 PayPal 支付页面
        window.location.href = data.approvalUrl;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Payment initialization failed. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 sm:py-24 text-center">
          <div className="mx-auto max-w-4xl px-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Simple{" "}
              <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Start free with 30 images per day. Upgrade anytime for more power.
              Cancel anytime.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-24 px-4">
          <div className="mx-auto max-w-6xl grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.type}
                className={`relative flex flex-col rounded-2xl border ${
                  plan.popular
                    ? "border-primary shadow-xl shadow-primary/10 scale-105"
                    : "border-border"
                } bg-card p-8 transition-all hover:shadow-lg`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon & Name */}
                <div className="mb-6">
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient} text-white mb-4`}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted text-sm">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-1">
                    {plan.dailyLimit} images per day
                  </p>
                </div>

                {/* Features */}
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.type)}
                  disabled={
                    currentPlan === plan.type || loadingPlan === plan.type
                  }
                  className={`w-full rounded-full py-3 px-6 text-sm font-semibold transition-all ${
                    plan.buttonStyle
                  } ${
                    currentPlan === plan.type
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:scale-105 active:scale-95"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.type ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : currentPlan === plan.type ? (
                    "Current Plan"
                  ) : plan.price === 0 ? (
                    "Get Started Free"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-24 px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Can I cancel anytime?",
                  a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept PayPal and all major credit/debit cards through PayPal.",
                },
                {
                  q: "What happens when I exceed my daily limit?",
                  a: "You'll need to wait until the next day for your quota to reset, or upgrade to a higher plan for more capacity.",
                },
                {
                  q: "Is there a free trial for paid plans?",
                  a: "The Free plan is always available with 30 images per day. You can upgrade to paid plans when you need more capacity.",
                },
              ].map(({ q, a }) => (
                <div
                  key={q}
                  className="rounded-xl border border-border p-6 bg-card"
                >
                  <h3 className="font-semibold mb-2">{q}</h3>
                  <p className="text-sm text-muted">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
