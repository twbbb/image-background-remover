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
