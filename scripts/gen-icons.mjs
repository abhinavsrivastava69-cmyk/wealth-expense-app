import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('./assets', { recursive: true });

// ── Icon SVG (1024×1024) ─────────────────────────────────────────────────────
// Dark navy background, rising bar chart + ₹ symbol
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F1624"/>
      <stop offset="100%" stop-color="#0A0E1A"/>
    </linearGradient>
    <linearGradient id="barGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#2A4D99"/>
      <stop offset="100%" stop-color="#4F8EF7"/>
    </linearGradient>
    <linearGradient id="barGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#1A5C3A"/>
      <stop offset="100%" stop-color="#2DCB73"/>
    </linearGradient>
    <linearGradient id="barGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#7A4A10"/>
      <stop offset="100%" stop-color="#F7A94F"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)" rx="0"/>

  <!-- Subtle grid lines -->
  <line x1="160" y1="640" x2="864" y2="640" stroke="#1C2235" stroke-width="2"/>
  <line x1="160" y1="520" x2="864" y2="520" stroke="#1C2235" stroke-width="2"/>
  <line x1="160" y1="400" x2="864" y2="400" stroke="#1C2235" stroke-width="2"/>
  <line x1="160" y1="280" x2="864" y2="280" stroke="#1C2235" stroke-width="2"/>

  <!-- Bar chart — 4 bars, rising trend -->
  <!-- Bar 1 -->
  <rect x="190" y="540" width="118" height="100" rx="12" fill="url(#barGrad)" opacity="0.85"/>
  <!-- Bar 2 -->
  <rect x="342" y="430" width="118" height="210" rx="12" fill="url(#barGrad)" opacity="0.9"/>
  <!-- Bar 3 -->
  <rect x="494" y="330" width="118" height="310" rx="12" fill="url(#barGrad2)" opacity="0.9"/>
  <!-- Bar 4 (tallest) -->
  <rect x="646" y="215" width="118" height="425" rx="12" fill="url(#barGrad2)"/>

  <!-- Trend line over bars -->
  <polyline
    points="249,520 401,395 553,295 705,185"
    fill="none"
    stroke="#4F8EF7"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
    opacity="0.7"
  />

  <!-- Arrow head at end of trend line -->
  <polygon points="705,185 680,210 730,210" fill="#4F8EF7" opacity="0.7"/>

  <!-- Bottom axis line -->
  <line x1="160" y1="642" x2="864" y2="642" stroke="#252B40" stroke-width="3"/>

  <!-- ₹ symbol — large, bottom-left area -->
  <text
    x="195"
    y="820"
    font-family="Georgia, serif"
    font-size="220"
    font-weight="bold"
    fill="#FFFFFF"
    opacity="0.12"
  >₹</text>

  <!-- App name subtle label -->
  <text
    x="512"
    y="920"
    font-family="Arial, sans-serif"
    font-size="52"
    font-weight="700"
    fill="#4F8EF7"
    text-anchor="middle"
    letter-spacing="6"
    opacity="0.9"
  >W&amp;E</text>
</svg>`;

// ── Splash SVG (1284×2778 — iPhone 14 Pro Max) ───────────────────────────────
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <rect width="1284" height="2778" fill="#0A0E1A"/>
  <!-- Centered icon area -->
  <g transform="translate(342, 1089)">
    <!-- Mini bars -->
    <rect x="30"  y="220" width="80" height="80"  rx="8" fill="#2A4D99" opacity="0.9"/>
    <rect x="140" y="160" width="80" height="140" rx="8" fill="#2A4D99" opacity="0.9"/>
    <rect x="250" y="100" width="80" height="200" rx="8" fill="#1A5C3A" opacity="0.9"/>
    <rect x="360" y="40"  width="80" height="260" rx="8" fill="#2DCB73"/>
    <!-- Trend line -->
    <polyline points="70,200 180,150 290,90 400,30" fill="none" stroke="#4F8EF7" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
  </g>
  <!-- App name -->
  <text x="642" y="1480" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="#FFFFFF" text-anchor="middle">Wealth &amp; Expense</text>
  <text x="642" y="1560" font-family="Arial, sans-serif" font-size="36" fill="#4F8EF7" text-anchor="middle" letter-spacing="3">PERSONAL FINANCE</text>
</svg>`;

// ── Favicon SVG (64×64) ───────────────────────────────────────────────────────
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0A0E1A" rx="12"/>
  <rect x="8"  y="42" width="10" height="14" rx="2" fill="#4F8EF7" opacity="0.8"/>
  <rect x="22" y="34" width="10" height="22" rx="2" fill="#4F8EF7" opacity="0.9"/>
  <rect x="36" y="24" width="10" height="32" rx="2" fill="#2DCB73"/>
  <rect x="50" y="14" width="10" height="42" rx="2" fill="#2DCB73"/>
  <polyline points="13,41 27,33 41,23 55,13" fill="none" stroke="#4F8EF7" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
</svg>`;

async function generateIcons() {
  console.log('Generating icons...');

  // 1. App icon — 1024×1024
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile('./assets/icon.png');
  console.log('✓ assets/icon.png');

  // 2. Adaptive icon (Android foreground) — 1024×1024
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile('./assets/adaptive-icon.png');
  console.log('✓ assets/adaptive-icon.png');

  // 3. Splash screen — 1284×2778
  await sharp(Buffer.from(splashSvg))
    .resize(1284, 2778)
    .png()
    .toFile('./assets/splash.png');
  console.log('✓ assets/splash.png');

  // 4. Favicon — 64×64
  await sharp(Buffer.from(faviconSvg))
    .resize(64, 64)
    .png()
    .toFile('./assets/favicon.png');
  console.log('✓ assets/favicon.png');

  console.log('All icons generated!');
}

generateIcons().catch(console.error);
