import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import type { UserProfile } from "@/lib/types";
import type { PlanType } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

// 复用全局存储
const globalStore = globalThis as unknown as { __userStore?: Map<string, UserProfile> };
if (!globalStore.__userStore) {
  globalStore.__userStore = new Map<string, UserProfile>();
}
const userStore = globalStore.__userStore;

/**
 * POST /api/checkout - 创建 PayPal 支付
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planType = body.plan as PlanType;

    if (!planType || !PLANS[planType] || planType === "free") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS[planType];
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
    const APP_URL = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://bgremover.app";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "PayPal is not configured" },
        { status: 500 }
      );
    }

    // 1. 获取 PayPal Access Token
    const authResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      console.error("PayPal auth failed:", await authResponse.text());
      return NextResponse.json(
        { error: "PayPal authentication failed" },
        { status: 500 }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // 2. 创建 PayPal 订单
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `${session.user.email}__${planType}`,
            description: `BGRemover ${plan.name} Plan - Monthly Subscription`,
            amount: {
              currency_code: "USD",
              value: plan.price.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "BGRemover",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${APP_URL}/api/checkout/success`,
          cancel_url: `${APP_URL}/pricing`,
        },
      }),
    });

    if (!orderResponse.ok) {
      console.error("PayPal order creation failed:", await orderResponse.text());
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 }
      );
    }

    const orderData = await orderResponse.json();

    // 找到 approval URL
    const approvalLink = orderData.links?.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    );

    if (!approvalLink) {
      return NextResponse.json(
        { error: "No approval URL found" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl: approvalLink.href,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
