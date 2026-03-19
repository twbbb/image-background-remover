#!/usr/bin/env node

/**
 * 测试腾讯云人像分割 API
 *
 * 使用方法：
 *   1. 先在 .env.local 中配置好 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY
 *   2. 运行: node scripts/test-remove-bg.mjs [可选图片路径]
 *
 * 如果不提供图片路径，会自动下载一张测试图片。
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

// ==================== 加载环境变量 ====================

function loadEnvFile() {
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local 文件不存在！请先配置腾讯云密钥。");
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
  }
}

loadEnvFile();

const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID;
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY;
const TENCENT_REGION = process.env.TENCENT_REGION || "ap-guangzhou";

if (
  !TENCENT_SECRET_ID ||
  !TENCENT_SECRET_KEY ||
  TENCENT_SECRET_ID === "your_secret_id_here"
) {
  console.error("❌ 腾讯云密钥未配置！请编辑 .env.local 文件：");
  console.error("");
  console.error("  TENCENT_SECRET_ID=你的SecretId");
  console.error("  TENCENT_SECRET_KEY=你的SecretKey");
  console.error("");
  console.error(
    "  获取地址: https://console.cloud.tencent.com/cam/capi"
  );
  process.exit(1);
}

// ==================== 腾讯云 API 签名 ====================

function sha256(message) {
  return crypto.createHash("sha256").update(message).digest("hex");
}

function hmacSha256(key, message) {
  return crypto.createHmac("sha256", key).update(message).digest();
}

async function callTencentCloudAPI({ service, action, version, region, payload }) {
  const host = `${service}.tencentcloudapi.com`;
  const endpoint = `https://${host}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split("T")[0];
  const payloadStr = JSON.stringify(payload);

  // Step 1: Build canonical request
  const contentType = "application/json; charset=utf-8";
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  const hashedPayload = sha256(payloadStr);

  const canonicalRequest = [
    "POST",
    "/",
    "",
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join("\n");

  // Step 2: Build string to sign
  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = [
    algorithm,
    timestamp.toString(),
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  // Step 3: Calculate signature
  const secretDate = hmacSha256(`TC3${TENCENT_SECRET_KEY}`, date);
  const secretService = hmacSha256(secretDate, service);
  const secretSigning = hmacSha256(secretService, "tc3_request");
  const signature = crypto
    .createHmac("sha256", secretSigning)
    .update(stringToSign)
    .digest("hex");

  // Step 4: Build authorization header
  const authorization = `${algorithm} Credential=${TENCENT_SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // Step 5: Send request
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      Host: host,
      "X-TC-Action": action,
      "X-TC-Version": version,
      "X-TC-Timestamp": timestamp.toString(),
      "X-TC-Region": region,
    },
    body: payloadStr,
  });

  const data = await response.json();

  if (data.Response?.Error) {
    throw new Error(
      `腾讯云 API 错误 [${data.Response.Error.Code}]: ${data.Response.Error.Message}`
    );
  }

  return data.Response;
}

// ==================== 下载测试图片 ====================

async function downloadTestImage() {
  const testImagePath = path.join(ROOT_DIR, "scripts", "test-input.jpg");

  if (fs.existsSync(testImagePath)) {
    console.log("📂 使用已有测试图片:", testImagePath);
    return testImagePath;
  }

  console.log("📥 正在下载测试图片...");
  // 使用 picsum.photos 的固定人物照片
  const imageUrl =
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face";

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(testImagePath, buffer);
    console.log(`✅ 测试图片已保存: ${testImagePath} (${(buffer.length / 1024).toFixed(1)}KB)`);
    return testImagePath;
  } catch (err) {
    console.error("❌ 下载测试图片失败:", err.message);
    console.error("   请手动提供图片路径: node scripts/test-remove-bg.mjs /path/to/image.jpg");
    process.exit(1);
  }
}

// ==================== 主流程 ====================

async function main() {
  console.log("=".repeat(60));
  console.log("🎯 腾讯云人像分割 API 测试");
  console.log("=".repeat(60));
  console.log("");

  // 1. 获取测试图片
  const inputArg = process.argv[2];
  let imagePath;

  if (inputArg) {
    imagePath = path.resolve(inputArg);
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ 图片文件不存在: ${imagePath}`);
      process.exit(1);
    }
    console.log("📂 使用指定图片:", imagePath);
  } else {
    imagePath = await downloadTestImage();
  }

  // 2. 读取图片并转换为 base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const imageSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2);

  console.log(`📐 图片大小: ${imageSizeMB}MB`);
  console.log(`🌍 区域: ${TENCENT_REGION}`);
  console.log("");

  if (parseFloat(imageSizeMB) > 5) {
    console.error("❌ 图片大小超过 5MB 限制！请压缩后重试。");
    process.exit(1);
  }

  // 3. 调用腾讯云 API
  console.log("🚀 正在调用腾讯云人像分割 API...");
  const startTime = Date.now();

  try {
    const result = await callTencentCloudAPI({
      service: "bda",
      action: "SegmentPortraitPic",
      version: "2020-03-24",
      region: TENCENT_REGION,
      payload: {
        Image: base64Image,
        RspImgType: "base64",
        Scene: "GEN",
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("");
    console.log(`✅ 抠图成功！耗时: ${elapsed}s`);
    console.log(`   HasForeground: ${result.HasForeground}`);
    console.log(`   RequestId: ${result.RequestId}`);

    // 4. 保存结果
    if (result.ResultImage) {
      const ext = path.extname(imagePath).replace(".", "") || "jpg";
      const baseName = path.basename(imagePath, `.${ext}`);
      const outputPath = path.join(
        ROOT_DIR,
        "scripts",
        `${baseName}-nobg.png`
      );

      const resultBuffer = Buffer.from(result.ResultImage, "base64");
      fs.writeFileSync(outputPath, resultBuffer);

      console.log(
        `   输出文件: ${outputPath} (${(resultBuffer.length / 1024).toFixed(1)}KB)`
      );
      console.log("");
      console.log("🎉 测试通过！腾讯云人像分割 API 工作正常！");
    } else {
      console.log("   ⚠️ 未返回 ResultImage，可能图片中没有检测到人像");
    }
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error("");
    console.error(`❌ 调用失败 (${elapsed}s):`);
    console.error(`   ${error.message}`);

    if (error.message.includes("AuthFailure")) {
      console.error("");
      console.error("   💡 请检查 SecretId 和 SecretKey 是否正确配置。");
      console.error("   获取地址: https://console.cloud.tencent.com/cam/capi");
    } else if (error.message.includes("UnauthorizedOperation")) {
      console.error("");
      console.error("   💡 人体分析服务可能未开通，请前往开通：");
      console.error(
        "   https://console.cloud.tencent.com/bda/portrait"
      );
    } else if (error.message.includes("InArrears")) {
      console.error("");
      console.error("   💡 账户欠费，请充值后重试。");
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("未处理的错误:", err);
  process.exit(1);
});
