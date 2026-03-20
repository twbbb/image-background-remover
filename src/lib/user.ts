import type { UserProfile, UsageInfo } from "./types";
import type { PlanType } from "./plans";
import { getDailyLimit } from "./plans";

/**
 * 获取今日日期字符串 (YYYY-MM-DD)
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * 创建默认用户档案
 */
export function createDefaultProfile(
  id: string,
  email: string,
  name: string,
  image: string
): UserProfile {
  return {
    id,
    email,
    name,
    image,
    createdAt: new Date().toISOString(),
    plan: "free",
    planExpiresAt: null,
    paypalSubscriptionId: null,
    totalProcessed: 0,
    todayProcessed: 0,
    todayDate: getTodayDate(),
  };
}

/**
 * 获取用户使用情况
 */
export function getUserUsageInfo(profile: UserProfile): UsageInfo {
  const today = getTodayDate();
  // 如果日期变了，今日使用重置为0
  const todayUsed = profile.todayDate === today ? profile.todayProcessed : 0;
  const dailyLimit = getDailyLimit(profile.plan);

  return {
    plan: profile.plan,
    dailyLimit,
    todayUsed,
    remaining: Math.max(0, dailyLimit - todayUsed),
    totalProcessed: profile.totalProcessed,
  };
}

/**
 * 检查用户是否还有额度
 */
export function hasRemainingQuota(profile: UserProfile): boolean {
  const usage = getUserUsageInfo(profile);
  return usage.remaining > 0;
}

/**
 * 增加使用次数（返回新的 profile）
 */
export function incrementUsage(profile: UserProfile): UserProfile {
  const today = getTodayDate();
  const isNewDay = profile.todayDate !== today;

  return {
    ...profile,
    totalProcessed: profile.totalProcessed + 1,
    todayProcessed: isNewDay ? 1 : profile.todayProcessed + 1,
    todayDate: today,
  };
}

/**
 * 检查套餐是否过期
 */
export function isPlanExpired(profile: UserProfile): boolean {
  if (profile.plan === "free") return false;
  if (!profile.planExpiresAt) return true;
  return new Date(profile.planExpiresAt) < new Date();
}

/**
 * 确保套餐有效（如果过期则降级为 free）
 */
export function ensurePlanValid(profile: UserProfile): UserProfile {
  if (isPlanExpired(profile)) {
    return {
      ...profile,
      plan: "free",
      planExpiresAt: null,
      paypalSubscriptionId: null,
    };
  }
  return profile;
}
