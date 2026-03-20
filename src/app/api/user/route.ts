import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { createDefaultProfile, getUserUsageInfo, ensurePlanValid } from "@/lib/user";
import type { UserProfile } from "@/lib/types";

// 简单的内存存储（生产环境应替换为 Cloudflare KV）
// 使用 globalThis 确保开发环境热重载不会丢失数据
const globalStore = globalThis as unknown as { __userStore?: Map<string, UserProfile> };
if (!globalStore.__userStore) {
  globalStore.__userStore = new Map<string, UserProfile>();
}
const userStore = globalStore.__userStore;

/**
 * GET /api/user - 获取当前登录用户信息
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;
    let profile = userStore.get(userId);

    if (!profile) {
      // 首次访问，创建默认档案
      profile = createDefaultProfile(
        userId,
        session.user.email,
        session.user.name || "",
        session.user.image || ""
      );
      userStore.set(userId, profile);
    }

    // 确保套餐有效
    profile = ensurePlanValid(profile);
    userStore.set(userId, profile);

    const usage = getUserUsageInfo(profile);

    return NextResponse.json({
      profile,
      usage,
    });
  } catch (error) {
    console.error("Failed to get user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
