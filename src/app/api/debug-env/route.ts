import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS_LENGTH: process.env.SMTP_PASS?.length || 0,
    SMTP_PASS_START: process.env.SMTP_PASS?.substring(0, 3) || 'not set',
    LIPILA_SECRET_KEY_SET: !!process.env.LIPILA_SECRET_KEY,
    LIPILA_BASE_URL: process.env.LIPILA_BASE_URL,
    LIPILA_CURRENCY: process.env.LIPILA_CURRENCY,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
