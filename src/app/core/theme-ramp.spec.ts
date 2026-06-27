import { brandCssVars } from './theme-ramp';

describe('theme-ramp.brandCssVars', () => {
  it('generates the full primary + accent token ramps as valid hex', () => {
    const vars = brandCssVars('#0F6E56', '#D85A30');
    const tokens = Object.keys(vars);
    expect(tokens).toContain('--teal-900');
    expect(tokens).toContain('--teal-100');
    expect(tokens).toContain('--coral-800');
    expect(tokens).toContain('--coral-100');
    for (const value of Object.values(vars)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('keeps the ramp ordered dark -> light (900 darker than 100)', () => {
    const vars = brandCssVars('#0F6E56', '#D85A30');
    expect(luminance(vars['--teal-900'])).toBeLessThan(luminance(vars['--teal-100']));
    expect(luminance(vars['--coral-800'])).toBeLessThan(luminance(vars['--coral-100']));
  });

  it('recolours with the chosen hue (a purple primary yields blue-dominant shades)', () => {
    const vars = brandCssVars('#7C3AED', '#F59E0B');
    const [r, , b] = rgb(vars['--teal-500']);
    expect(b).toBeGreaterThan(r); // purple => blue channel dominates red
  });

  it('returns no tokens for an invalid colour (leaves theme untouched)', () => {
    expect(brandCssVars('not-a-color', 'also-bad')).toEqual({});
  });
});

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
