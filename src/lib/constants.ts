import { User, ShoppingBag, Layers } from "lucide-react";
import type { MattingTab, PresetColor } from "./types";

/** 抠图模式配置 */
export const MATTING_TABS: MattingTab[] = [
  {
    mode: "portrait",
    label: "Portrait",
    icon: User,
    description: "Best for people & faces",
  },
  {
    mode: "goods",
    label: "Product",
    icon: ShoppingBag,
    description: "Best for products & goods",
  },
  {
    mode: "general",
    label: "General",
    icon: Layers,
    description: "Works for any subject",
  },
];

/** 预设背景颜色 */
export const PRESET_COLORS: PresetColor[] = [
  { name: "Transparent", value: "transparent", class: "checkerboard" },
  { name: "White", value: "#FFFFFF", class: "bg-white" },
  { name: "Black", value: "#000000", class: "bg-black" },
  { name: "Red", value: "#EF4444", class: "bg-red-500" },
  { name: "Blue", value: "#3B82F6", class: "bg-blue-500" },
  { name: "Green", value: "#22C55E", class: "bg-green-500" },
  { name: "Yellow", value: "#EAB308", class: "bg-yellow-500" },
  { name: "Purple", value: "#A855F7", class: "bg-purple-500" },
  { name: "Pink", value: "#EC4899", class: "bg-pink-500" },
  { name: "Orange", value: "#F97316", class: "bg-orange-500" },
  { name: "Cyan", value: "#06B6D4", class: "bg-cyan-500" },
  { name: "Gray", value: "#9CA3AF", class: "bg-gray-400" },
];

/** 支持的图片类型 */
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/bmp",
];

/** 最大文件大小 (20MB) */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** 站点基础 URL */
export const SITE_URL = "https://bgremover.app";
