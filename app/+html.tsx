import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file customises the root HTML for every statically-rendered web page.
// It exists so the installed PWA / "Add to Home Screen" gets the right name,
// icon and theme colour — Expo does not derive these from app.json's web block.
// EXPO_BASE_URL is injected at build time ("/wealth-expense-app" on GitHub Pages).
const BASE = process.env.EXPO_BASE_URL ?? '';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Kosh</title>
        <meta name="application-name" content="Kosh" />
        <meta name="apple-mobile-web-app-title" content="Kosh" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#2563EB" />
        <meta
          name="description"
          content="Kosh — personal finance: net worth, credit card cycles, budgets & guidance."
        />
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`${BASE}/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${BASE}/icon-192.png`} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
