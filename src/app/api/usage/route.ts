import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { hasRemainingQuota, incrementUsage, ensurePlanValid, getUserUsageInfo, createDefaultProfile } from "@/lib/user";
import type { UserProfile } from "@/lib/types";

// 复用同一个全局存储
const globalStore = globalThis as unknown as { __userStore?: Map<string, UserProfile> };
if (!globalStore.__userStore) {
  globalStore.__userStore = new Map<string, UserProfile>();
}
const userStore = globalStore.__userStore;

/**
 * POST /api/usage - 消耗一次额度
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;
    let profile = userStore.get(userId);

    if (!profile) {
      profile = createDefaultProfile(
        userId,
        session.user.email,
        session.user.name || "",
        session.user.image || ""
      );
    }

    profile = ensurePlanValid(profile);

    if (!hasRemainingQuota(profile)) {
      return NextResponse.json(
        { error: "Daily quota exceeded", usage: getUserUsageInfo(profile) },
        { status: 429 }
      );
    }

    // 增加使用次数
    profile = incrementUsage(profile);
    userStore.set(userId, profile);

    return NextResponse.json({
      success: true,
      usage: getUserUsageInfo(profile),
    });
  } catch (error) {
    console.error("Failed to update usage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/usage - 获取额度信息
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      // 未登录用户返回免费额度信息（不追踪）
      return NextResponse.json({
        usage: {
          plan: "free",
          dailyLimit: 30,
          todayUsed: 0,
          remaining: 30,
          totalProcessed: 0,
        },
      });
    }

    const userId = session.user.email;
    let profile = userStore.get(userId);

    if (!profile) {
      profile = createDefaultProfile(
        userId,
        session.user.email,
        session.user.name || "",
        session.user.image || ""
      );
      userStore.set(userId, profile);
    }

    profile = ensurePlanValid(profile);

    return NextResponse.json({
      usage: getUserUsageInfo(profile),
    });
  } catch (error) {
    console.error("Failed to get usage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
