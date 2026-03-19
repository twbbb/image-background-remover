import { NextRequest, NextResponse } from "next/server";
import { removeBackgroundCI, type MattingMode } from "@/lib/tencent-cos";

export const runtime = "edge";

interface RemoveBgRequest {
  image: string; // base64 or data URL
  mode?: MattingMode; // portrait, goods, general
}

/**
 * POST /api/remove-bg
 * Remove background from image using Tencent Cloud COS CI
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body (limit check via Next.js config if needed)
    const body: RemoveBgRequest = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { success: false, error: "Missing image data. Please provide base64 encoded image." },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    let base64Data = body.image;
    if (base64Data.startsWith("data:")) {
      const commaIndex = base64Data.indexOf(",");
      if (commaIndex !== -1) {
        base64Data = base64Data.slice(commaIndex + 1);
      }
    }

    // Validate base64 size (≤ 10MB after decode)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB > 10) {
      return NextResponse.json(
        { success: false, error: "Image too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate mode
    const mode: MattingMode = (["portrait", "goods", "general"].includes(body.mode || ""))
      ? (body.mode as MattingMode)
      : "portrait";

    // Call Tencent Cloud CI matting API
    const result = await removeBackgroundCI(base64Data, mode);

    if (!result.hasForeground) {
      return NextResponse.json(
        { success: false, error: "No foreground detected in the image. Please try a different image." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      image: result.resultImage,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Background removal API error:", errMsg);

    if (errMsg.includes("InArrears")) {
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    if (errMsg.includes("ImageSizeExceed") || errMsg.includes("ImageResolutionExceed")) {
      return NextResponse.json(
        { success: false, error: "Image is too large or resolution exceeds limit. Please resize and try again." },
        { status: 400 }
      );
    }
    if (errMsg.includes("Missing TENCENT_")) {
      return NextResponse.json(
        { success: false, error: "Server configuration error. Please check environment variables." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to remove background. Please try again." },
      { status: 500 }
    );
  }
}
