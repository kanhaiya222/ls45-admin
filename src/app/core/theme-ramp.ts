/**
 * Theme ramp generation: turn ONE brand colour into the full set of design-token shades the app
 * uses (`--teal-*` = primary, `--coral-*` = accent). Each stop keeps the chosen colour's hue and
 * (scaled) saturation but pins a fixed lightness, so the ramp stays coherent and accessible whatever
 * colour the admin picks. Returns a `{ '--token': '#hex' }` map to set on the document root.
 */

interface Stop {
  readonly token: string;
  readonly l: number; // target lightness 0..100
  readonly sat: number; // saturation scale 0..1 (lighter stops desaturate)
}

// Lightness/saturation profile reverse-engineered from the shipped teal/coral ramps.
const PRIMARY_STOPS: readonly Stop[] = [
  { token: '--teal-900', l: 11, sat: 1.0 },
  { token: '--teal-800', l: 17, sat: 1.0 },
  { token: '--teal-700', l: 25, sat: 1.0 },
  { token: '--teal-500', l: 37, sat: 0.95 },
  { token: '--teal-300', l: 58, sat: 0.78 },
  { token: '--teal-200', l: 75, sat: 0.6 },
  { token: '--teal-100', l: 92, sat: 0.5 },
];

const ACCENT_STOPS: readonly Stop[] = [
  { token: '--coral-800', l: 26, sat: 1.0 },
  { token: '--coral-600', l: 36, sat: 1.0 },
  { token: '--coral-400', l: 52, sat: 1.0 },
  { token: '--coral-100', l: 94, sat: 0.5 },
];

/** Build the full set of primary + accent CSS variables from two base colours. */
export function brandCssVars(primaryHex: string, accentHex: string): Record<string, string> {
  return { ...buildRamp(primaryHex, PRIMARY_STOPS), ...buildRamp(accentHex, ACCENT_STOPS) };
}

function buildRamp(baseHex: string, stops: readonly Stop[]): Record<string, string> {
  const base = hexToHsl(baseHex);
  const out: Record<string, string> = {};
  if (!base) {
    return out; // invalid colour -> leave tokens untouched
  }
  for (const s of stops) {
    out[s.token] = hslToHex(base.h, clamp(base.s * s.sat, 0, 100), s.l);
  }
  return out;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex.trim());
  if (!m) {
    return null;
  }
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mC = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  const toHex = (v: number) =>
    Math.round((v + mC) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
