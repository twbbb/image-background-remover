import type { PlanType } from "./plans";

/** 抠图模式 */
export type MattingMode = "portrait" | "goods" | "general";

/** 编辑器状态 */
export type EditorState = "upload" | "processing" | "result";

/** 背景去除结果 */
export interface RemovalResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

/** 处理进度 */
export interface RemovalProgress {
  phase: "loading" | "processing" | "done";
  progress: number; // 0-1
  message: string;
}

/** 抠图模式标签页定义 */
export interface MattingTab {
  mode: MattingMode;
  label: string;
  icon: React.ElementType;
  description: string;
}

/** 预设背景颜色 */
export interface PresetColor {
  name: string;
  value: string;
  class: string;
}

/** 用户档案 */
export interface UserProfile {
  id: string;              // Google OAuth sub ID
  email: string;
  name: string;
  image: string;
  createdAt: string;       // ISO 日期

  // 订阅信息
  plan: PlanType;
  planExpiresAt: string | null;   // 订阅到期时间
  paypalSubscriptionId: string | null;

  // 使用统计
  totalProcessed: number;  // 总处理图片数
  todayProcessed: number;  // 今日处理数
  todayDate: string;       // 用于每日重置计数
}

/** 用户使用额度信息 */
export interface UsageInfo {
  plan: PlanType;
  dailyLimit: number;
  todayUsed: number;
  remaining: number;
  totalProcessed: number;
}