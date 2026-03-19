import crypto from "crypto";

/**
 * Tencent Cloud COS CI Matting Service
 * Ported from Go backend (server/tencent/client.go)
 */

export type MattingMode = "portrait" | "goods" | "general";

interface CIProcessMap {
  [key: string]: string;
}

const CI_PROCESS_MAP: CIProcessMap = {
  portrait: "AIPortraitMatting", // 人像抠图
  goods: "GoodsMatting", // 商品抠图
  general: "AIPicMatting", // 通用抠图
};

function getCIProcess(mode: MattingMode): string {
  return CI_PROCESS_MAP[mode] || "AIPortraitMatting";
}

/**
 * Get required env vars with validation
 * Supports both TXY_SECRETID/TXY_SECRETKEY and TENCENT_SECRET_ID/TENCENT_SECRET_KEY
 */
function getConfig() {
  const secretId = process.env.TXY_SECRETID || process.env.TENCENT_SECRET_ID || "";
  const secretKey = process.env.TXY_SECRETKEY || process.env.TENCENT_SECRET_KEY || "";
  const bucket = process.env.TENCENT_COS_BUCKET || "";
  const region =
    process.env.TENCENT_COS_REGION ||
    process.env.TENCENT_REGION ||
    "ap-guangzhou";

  if (!secretId || !secretKey) {
    throw new Error(
      "Missing TXY_SECRETID/TXY_SECRETKEY or TENCENT_SECRET_ID/TENCENT_SECRET_KEY environment variables"
    );
  }
  if (!bucket) {
    throw new Error("Missing TENCENT_COS_BUCKET environment variable");
  }

  const host = `${bucket}.cos.${region}.myqcloud.com`;
  return { secretId, secretKey, bucket, region, host };
}

/**
 * Generate COS API authorization signature (HMAC-SHA1)
 * https://cloud.tencent.com/document/product/436/7778
 */
function cosSign(
  secretId: string,
  secretKey: string,
  httpMethod: string,
  uriPathname: string,
  urlParams: Record<string, string> | null,
  headers: Record<string, string>,
  expireSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000);
  const keyTime = `${now};${now + expireSeconds}`;

  // Step 1: SignKey
  const signKey = hmacSHA1Hex(secretKey, keyTime);

  // Step 2: Build sorted parameter and header lists
  const [urlParamList, httpParameters] = buildSortedKV(urlParams || {});
  const [headerList, httpHeaders] = buildSortedKV(headers);

  // Step 3: HttpString
  const httpString = [httpMethod, uriPathname, httpParameters, httpHeaders, ""].join("\n");

  // Step 4: StringToSign
  const stringToSign = ["sha1", keyTime, sha1Hex(httpString), ""].join("\n");

  // Step 5: Signature
  const signature = hmacSHA1Hex(signKey, stringToSign);

  // Step 6: Authorization
  return `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=${headerList}&q-url-param-list=${urlParamList}&q-signature=${signature}`;
}

function buildSortedKV(params: Record<string, string>): [string, string] {
  const keys = Object.keys(params)
    .map((k) => k.toLowerCase())
    .sort();

  if (keys.length === 0) return ["", ""];

  const kvPairs = keys.map((k) => {
    // Find original key (case-insensitive)
    const origKey = Object.keys(params).find(
      (ok) => ok.toLowerCase() === k
    )!;
    return `${encodeURIComponent(k)}=${encodeURIComponent(params[origKey])}`;
  });

  return [keys.join(";"), kvPairs.join("&")];
}

function sha1Hex(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function hmacSHA1Hex(key: string, data: string): string {
  return crypto.createHmac("sha1", key).update(data).digest("hex");
}

/**
 * Upload image data to COS
 */
async function cosUpload(
  secretId: string,
  secretKey: string,
  host: string,
  objectKey: string,
  data: Buffer
): Promise<void> {
  const url = `https://${host}/${objectKey}`;

  // Simple content type detection
  const contentType = detectContentType(data);

  const auth = cosSign(
    secretId,
    secretKey,
    "put",
    `/${objectKey}`,
    null,
    { "content-type": contentType, host },
    600
  );

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      Host: host,
      Authorization: auth,
    },
    body: data,
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`COS upload failed (${resp.status}): ${body}`);
  }
}

/**
 * Download image from COS with CI matting processing
 */
async function cosGetWithMatting(
  secretId: string,
  secretKey: string,
  host: string,
  objectKey: string,
  ciProcess: string
): Promise<Buffer> {
  const params = new URLSearchParams({ "ci-process": ciProcess });
  const url = `https://${host}/${objectKey}?${params.toString()}`;

  const auth = cosSign(
    secretId,
    secretKey,
    "get",
    `/${objectKey}`,
    { "ci-process": ciProcess },
    { host },
    600
  );

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Host: host,
      Authorization: auth,
    },
  });

  const body = Buffer.from(await resp.arrayBuffer());

  if (!resp.ok) {
    throw new Error(
      `CI matting failed (${resp.status}): ${body.toString("utf-8")}`
    );
  }

  // Check if response is an error (XML/JSON instead of image)
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("xml") || ct.includes("json")) {
    throw new Error(`CI matting returned error: ${body.toString("utf-8")}`);
  }

  return body;
}

/**
 * Delete object from COS
 */
async function cosDelete(
  secretId: string,
  secretKey: string,
  host: string,
  objectKey: string
): Promise<void> {
  const url = `https://${host}/${objectKey}`;

  const auth = cosSign(
    secretId,
    secretKey,
    "delete",
    `/${objectKey}`,
    null,
    { host },
    600
  );

  await fetch(url, {
    method: "DELETE",
    headers: {
      Host: host,
      Authorization: auth,
    },
  });
}

/**
 * Simple content type detection from buffer magic bytes
 */
function detectContentType(data: Buffer): string {
  if (data[0] === 0xff && data[1] === 0xd8) return "image/jpeg";
  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  )
    return "image/png";
  if (data[0] === 0x52 && data[1] === 0x49) return "image/webp";
  if (data[0] === 0x42 && data[1] === 0x4d) return "image/bmp";
  return "application/octet-stream";
}

/**
 * Remove background from image using Tencent Cloud COS CI matting API
 * Flow: Upload to COS → Download with ci-process matting → Delete temp file
 */
export async function removeBackgroundCI(
  imageBase64: string,
  mode: MattingMode = "portrait"
): Promise<{ resultImage: string; hasForeground: boolean }> {
  const { secretId, secretKey, host } = getConfig();

  // Decode base64 image
  const imageBuffer = Buffer.from(imageBase64, "base64");

  // Generate unique object key
  const objectKey = `tmp/matting_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;

  // Step 1: Upload image to COS
  await cosUpload(secretId, secretKey, host, objectKey, imageBuffer);

  try {
    // Step 2: Download with matting processing
    const ciProcess = getCIProcess(mode);
    const resultBuffer = await cosGetWithMatting(
      secretId,
      secretKey,
      host,
      objectKey,
      ciProcess
    );

    // Convert result to base64
    const resultBase64 = resultBuffer.toString("base64");

    return {
      resultImage: resultBase64,
      hasForeground: resultBuffer.length > 0,
    };
  } finally {
    // Step 3: Clean up - delete temp object (always, even on error)
    await cosDelete(secretId, secretKey, host, objectKey).catch(() => {
      // Ignore cleanup errors
    });
  }
}
