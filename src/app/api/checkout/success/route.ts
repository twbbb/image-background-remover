import { NextRequest, NextResponse } from "next/server";
import type { UserProfile } from "@/lib/types";
import type { PlanType } from "@/lib/plans";
import { createDefaultProfile } from "@/lib/user";

// 复用全局存储
const globalStore = globalThis as unknown as { __userStore?: Map<string, UserProfile> };
if (!globalStore.__userStore) {
  globalStore.__userStore = new Map<string, UserProfile>();
}
const userStore = globalStore.__userStore;

/**
 * GET /api/checkout/success - PayPal 支付成功回调
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token"); // PayPal order ID
  const APP_URL = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://bgremover.app";

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/pricing?error=missing_token`);
  }

  try {
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.redirect(`${APP_URL}/pricing?error=config`);
    }

    // 1. 获取 Access Token
    const authResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // 2. 捕获（确认）订单
    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${token}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = await captureResponse.json();

    if (captureData.status !== "COMPLETED") {
      console.error("PayPal capture failed:", captureData);
      return NextResponse.redirect(`${APP_URL}/pricing?error=payment_failed`);
    }

    // 3. 从 reference_id 中提取用户邮箱和套餐
    const referenceId =
      captureData.purchase_units?.[0]?.reference_id || "";
    const [email, planType] = referenceId.split("__") as [string, PlanType];

    if (!email || !planType) {
      console.error("Invalid reference_id:", referenceId);
      return NextResponse.redirect(`${APP_URL}/pricing?error=invalid_order`);
    }

    // 4. 更新用户套餐
    let profile = userStore.get(email);
    if (!profile) {
      profile = createDefaultProfile(email, email, "", "");
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 一个月有效期

    profile = {
      ...profile,
      plan: planType,
      planExpiresAt: expiresAt.toISOString(),
      paypalSubscriptionId: token,
    };
    userStore.set(email, profile);

    // 5. 重定向到个人中心
    return NextResponse.redirect(`${APP_URL}/profile?payment=success`);
  } catch (error) {
    console.error("Payment success callback error:", error);
    return NextResponse.redirect(`${APP_URL}/pricing?error=unknown`);
  }
}
