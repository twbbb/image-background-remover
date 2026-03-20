import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? `set (${process.env.AUTH_GOOGLE_ID.substring(0, 10)}...)` : "NOT SET",
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? `set (${process.env.AUTH_GOOGLE_SECRET.substring(0, 6)}...)` : "NOT SET",
    AUTH_SECRET: process.env.AUTH_SECRET ? `set (${process.env.AUTH_SECRET.substring(0, 6)}...)` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV || "NOT SET",
  })
}