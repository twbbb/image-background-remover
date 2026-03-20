/** 套餐类型 */
export type PlanType = "free" | "pro" | "business";

/** 套餐配置 */
export interface PlanConfig {
  name: string;
  type: PlanType;
  price: number; // 月费(美元)
  dailyLimit: number; // 每日处理次数
  features: string[];
  popular?: boolean;
}

/** 所有套餐定义 */
export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: "Free",
    type: "free",
    price: 0,
    dailyLimit: 30,
    features: [
      "30 images per day",
      "Standard quality",
      "Portrait & General mode",
      "PNG download",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    type: "pro",
    price: 1,
    dailyLimit: 300,
    popular: true,
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
  business: {
    name: "Business",
    type: "business",
    price: 10,
    dailyLimit: 3000,
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
};

/** 获取套餐配置 */
export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLANS[plan] || PLANS.free;
}

/** 获取每日额度 */
export function getDailyLimit(plan: PlanType): number {
  return getPlanConfig(plan).dailyLimit;
}
