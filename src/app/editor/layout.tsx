import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Background Remover Editor - Remove & Replace Background Free",
  description:
    "Upload your image and remove the background instantly with AI. Replace with solid colors or custom backgrounds. Free online editor.",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
