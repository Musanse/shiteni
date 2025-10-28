import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "Shiteni - Multi-Vending Platform",
  description: "Comprehensive multi-vending platform that transforms institutions into digital businesses, offering hotel management, online stores, pharmacy stores, and bus ticketing solutions",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icons/favicon.ico", sizes: "32x32", type: "image/x-icon" }
    ],
    apple: [
      { url: "/favicon.ico", sizes: "180x180", type: "image/x-icon" },
      { url: "/icons/favicon.ico", sizes: "180x180", type: "image/x-icon" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shiteni",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Shiteni",
    title: "Shiteni - Multi-Vending Platform",
    description: "Comprehensive multi-vending platform that transforms institutions into digital businesses, offering hotel management, online stores, pharmacy stores, and bus ticketing solutions",
  },
  other: {
    // Optimize image loading behavior
    'image-loading': 'eager',
    'lazy-loading': 'disabled'
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/api/manifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Shiteni" />
        <link rel="apple-touch-icon" href="/icons/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <PWAInstallPrompt />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler for AbortError
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.name === 'AbortError') {
                  console.warn('Suppressed AbortError:', event.reason.message);
                  event.preventDefault();
                }
              });

              // Additional AbortError handler for console errors
              const originalConsoleError = console.error;
              console.error = function(...args) {
                if (args[0] && typeof args[0] === 'object' && args[0].name === 'AbortError') {
                  console.warn('Suppressed AbortError from console.error:', args[0].message);
                  return;
                }
                originalConsoleError.apply(console, args);
              };

              // Handle audio/video play/pause errors
              window.addEventListener('error', function(event) {
                if (event.error && event.error.name === 'AbortError') {
                  console.warn('Suppressed AbortError:', event.error.message);
                  event.preventDefault();
                }
              });

              // Handle AbortError from audio/video elements specifically
              document.addEventListener('DOMContentLoaded', function() {
                // Override play() method to handle AbortError
                const originalPlay = HTMLMediaElement.prototype.play;
                HTMLMediaElement.prototype.play = function() {
                  const playPromise = originalPlay.call(this);
                  if (playPromise && typeof playPromise.catch === 'function') {
                    return playPromise.catch(error => {
                      if (error.name === 'AbortError') {
                        console.warn('Suppressed AbortError from play():', error.message);
                        return Promise.resolve();
                      }
                      throw error;
                    });
                  }
                  return playPromise;
                };
              });

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                  })
                    .then(function(registration) {
                      console.log('SW registered successfully: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}