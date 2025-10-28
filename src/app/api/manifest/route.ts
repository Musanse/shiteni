import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "Shiteni - Multi-Vending Platform",
    short_name: "Shiteni",
    description: "Comprehensive multi-vending platform that transforms institutions into digital businesses",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
        purpose: "any"
      },
      {
        src: "/icons/favicon.ico",
        sizes: "180x180",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ],
    categories: ["business", "shopping", "productivity"],
    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide"
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow"
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
