import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "Shiteni - Multi-Vending Platform",
    short_name: "Shiteni",
    description: "Comprehensive multi-vending platform that transforms institutions into digital businesses, offering hotel management, online stores, pharmacy stores, and bus ticketing solutions",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
        purpose: "any"
      }
    ]
  };

  return new NextResponse(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
