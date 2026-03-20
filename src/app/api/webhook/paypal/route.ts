import { NextRequest, NextResponse } from "next/server";
import type { UserProfile } from "@/lib/types";
import type { PlanType } from "@/lib/plans";
import { createDefaultProfile } from "@/lib/user";

// 复用全局存储
const globalStore = globalThis as unknown as {
  __userStore?: Map<string, UserProfile>;
};
if (!globalStore.__userStore) {
  globalStore.__userStore = new Map<string, UserProfile>();
}
const userStore = globalStore.__userStore;

// ================ PayPal 工具函数 ================

/** 获取 PayPal Access Token */
async function getPayPalAccessToken(): Promise<string> {
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  const PAYPAL_API_BASE =
    process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

  const authResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  const authData = await authResponse.json();
  return authData.access_token;
}

/** 验证 PayPal Webhook 签名 */
async function verifyWebhookSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn("PAYPAL_WEBHOOK_ID 未配置，跳过签名验证");
    return true; // 开发环境可先不验证
  }

  const PAYPAL_API_BASE =
    process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

  try {
    const accessToken = await getPayPalAccessToken();

    const verifyResponse = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          auth_algo: request.headers.get("paypal-auth-algo") || "",
          cert_url: request.headers.get("paypal-cert-url") || "",
          transmission_id: request.headers.get("paypal-transmission-id") || "",
          transmission_sig: request.headers.get("paypal-transmission-sig") || "",
          transmission_time:
            request.headers.get("paypal-transmission-time") || "",
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(body),
        }),
      }
    );

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Webhook 签名验证失败:", error);
    return false;
  }
}

// ================ 事件处理函数 ================

/**
 * 处理支付成功事件
 * 事件: PAYMENT.CAPTURE.COMPLETED
 */
function handlePaymentCompleted(event: Record<string, unknown>): void {
  const resource = event.resource as Record<string, unknown>;
  const customId = (resource?.custom_id as string) || "";
  const [email, planType] = customId.split("__") as [string, PlanType];

  if (!email || !planType) {
    // 尝试从 supplementary_data 获取
    const supplementaryData = resource?.supplementary_data as Record<string, unknown>;
    const relatedIds = supplementaryData?.related_ids as Record<string, unknown>;
    const orderId = relatedIds?.order_id as string;
    console.log(
      `[Webhook] PAYMENT.CAPTURE.COMPLETED - 订单 ${orderId}，但无法解析用户信息`
    );
    return;
  }

  activateUserPlan(email, planType);
  console.log(
    `[Webhook] PAYMENT.CAPTURE.COMPLETED - 用户 ${email} 升级到 ${planType}`
  );
}

/**
 * 处理订阅激活事件
 * 事件: BILLING.SUBSCRIPTION.ACTIVATED
 */
function handleSubscriptionActivated(event: Record<string, unknown>): void {
  const resource = event.resource as Record<string, unknown>;
  const subscriptionId = resource?.id as string;
  const customId = (resource?.custom_id as string) || "";
  const [email, planType] = customId.split("__") as [string, PlanType];

  if (!email || !planType) {
    console.log(
      `[Webhook] BILLING.SUBSCRIPTION.ACTIVATED - 订阅 ${subscriptionId}，但无法解析用户信息`
    );
    return;
  }

  const profile = activateUserPlan(email, planType);
  if (profile) {
    profile.paypalSubscriptionId = subscriptionId;
    userStore.set(email, profile);
  }

  console.log(
    `[Webhook] BILLING.SUBSCRIPTION.ACTIVATED - 用户 ${email} 订阅 ${planType} 已激活，订阅ID: ${subscriptionId}`
  );
}

/**
 * 处理订阅取消事件
 * 事件: BILLING.SUBSCRIPTION.CANCELLED
 */
function handleSubscriptionCancelled(event: Record<string, unknown>): void {
  const resource = event.resource as Record<string, unknown>;
  const subscriptionId = resource?.id as string;
  const customId = (resource?.custom_id as string) || "";
  const [email] = customId.split("__") as [string, PlanType];

  if (!email) {
    // 通过订阅 ID 反查用户
    const foundEntry = Array.from(userStore.entries()).find(
      ([, profile]) => profile.paypalSubscriptionId === subscriptionId
    );

    if (foundEntry) {
      const [foundEmail, foundProfile] = foundEntry;
      deactivateUserPlan(foundEmail, foundProfile);
      console.log(
        `[Webhook] BILLING.SUBSCRIPTION.CANCELLED - 通过订阅ID ${subscriptionId} 找到用户 ${foundEmail}，已取消订阅`
      );
    } else {
      console.log(
        `[Webhook] BILLING.SUBSCRIPTION.CANCELLED - 订阅 ${subscriptionId}，但无法找到对应用户`
      );
    }
    return;
  }

  const profile = userStore.get(email);
  if (profile) {
    deactivateUserPlan(email, profile);
  }

  console.log(
    `[Webhook] BILLING.SUBSCRIPTION.CANCELLED - 用户 ${email} 订阅已取消，降级为 Free`
  );
}

/**
 * 处理订阅暂停事件
 * 事件: BILLING.SUBSCRIPTION.SUSPENDED
 */
function handleSubscriptionSuspended(event: Record<string, unknown>): void {
  const resource = event.resource as Record<string, unknown>;
  const subscriptionId = resource?.id as string;
  const customId = (resource?.custom_id as string) || "";
  const [email] = customId.split("__") as [string, PlanType];

  if (email) {
    const profile = userStore.get(email);
    if (profile) {
      deactivateUserPlan(email, profile);
    }
  } else {
    const foundEntry = Array.from(userStore.entries()).find(
      ([, profile]) => profile.paypalSubscriptionId === subscriptionId
    );
    if (foundEntry) {
      deactivateUserPlan(foundEntry[0], foundEntry[1]);
    }
  }

  console.log(
    `[Webhook] BILLING.SUBSCRIPTION.SUSPENDED - 订阅 ${subscriptionId} 已暂停`
  );
}

/**
 * 处理支付退款事件
 * 事件: PAYMENT.CAPTURE.REFUNDED
 */
function handlePaymentRefunded(event: Record<string, unknown>): void {
  const resource = event.resource as Record<string, unknown>;
  const customId = (resource?.custom_id as string) || "";
  const [email] = customId.split("__") as [string, PlanType];

  if (email) {
    const profile = userStore.get(email);
    if (profile) {
      deactivateUserPlan(email, profile);
      console.log(
        `[Webhook] PAYMENT.CAPTURE.REFUNDED - 用户 ${email} 退款，降级为 Free`
      );
    }
  }
}

// ================ 用户套餐操作 ================

/** 激活用户套餐 */
function activateUserPlan(
  email: string,
  planType: PlanType
): UserProfile | null {
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
  };

  userStore.set(email, profile);
  return profile;
}

/** 取消用户套餐，降级为免费 */
function deactivateUserPlan(email: string, profile: UserProfile): void {
  const updatedProfile: UserProfile = {
    ...profile,
    plan: "free",
    planExpiresAt: null,
    paypalSubscriptionId: null,
  };
  userStore.set(email, updatedProfile);
}

// ================ 主路由 ================

/**
 * POST /api/webhook/paypal - PayPal Webhook 异步通知
 *
 * 处理的事件类型:
 * - PAYMENT.CAPTURE.COMPLETED  : 支付成功
 * - BILLING.SUBSCRIPTION.ACTIVATED : 订阅激活
 * - BILLING.SUBSCRIPTION.CANCELLED : 订阅取消
 * - BILLING.SUBSCRIPTION.SUSPENDED : 订阅暂停
 * - PAYMENT.CAPTURE.REFUNDED : 支付退款
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // 1. 验证 Webhook 签名
    const isValid = await verifyWebhookSignature(request, body);
    if (!isValid) {
      console.error("[Webhook] 签名验证失败，拒绝处理");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // 2. 解析事件
    const event = JSON.parse(body) as Record<string, unknown>;
    const eventType = event.event_type as string;
    const eventId = event.id as string;

    console.log(`[Webhook] 收到事件: ${eventType} (ID: ${eventId})`);

    // 3. 根据事件类型分发处理
    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        handlePaymentCompleted(event);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        handleSubscriptionActivated(event);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        handleSubscriptionCancelled(event);
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        handleSubscriptionSuspended(event);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        handlePaymentRefunded(event);
        break;

      default:
        console.log(`[Webhook] 未处理的事件类型: ${eventType}`);
    }

    // 4. 返回 200 确认收到（PayPal 要求必须返回 200，否则会重试）
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] 处理异常:", error);
    // 即使出错也返回 200，避免 PayPal 反复重试
    // 如果需要重试可返回 500
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhook/paypal - 健康检查
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "PayPal Webhook endpoint is active",
    events: [
      "PAYMENT.CAPTURE.COMPLETED",
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "BILLING.SUBSCRIPTION.CANCELLED",
      "BILLING.SUBSCRIPTION.SUSPENDED",
      "PAYMENT.CAPTURE.REFUNDED",
    ],
  });
}
