import { contrastRatio, withAlpha } from '../color';
import { resolveTheme } from '../ThemeProvider';
import { darkTheme, lightTheme, Theme } from '../themes';

/** Pares texto/fondo que la interfaz usa. WCAG 2.2 AA: 4.5:1 texto normal, 3:1 texto grande/íconos. */
function textPairs(t: Theme): [string, string, string, number][] {
  const c = t.colors;
  return [
    ['texto / fondo', c.text, c.background, 4.5],
    ['texto / superficie', c.text, c.surface, 4.5],
    ['secundario / superficie', c.textSecondary, c.surface, 4.5],
    ['secundario / superficie atenuada', c.textSecondary, c.surfaceMuted, 4.5],
    ['atenuado / superficie', c.textMuted, c.surface, 4.5],
    ['atenuado / superficie atenuada', c.textMuted, c.surfaceMuted, 4.5],
    ['atenuado / fondo', c.textMuted, c.background, 4.5],
    ['primario / superficie', c.primary, c.surface, 4.5],
    ['botón primario', c.onPrimary, c.primary, 4.5],
    ['éxito / superficie', c.success, c.surface, 4.5],
    ['advertencia / superficie', c.warning, c.surface, 4.5],
    ['peligro / superficie', c.danger, c.surface, 4.5],
    ['hero texto', c.heroText, c.heroEnd, 4.5],
    ['hero atenuado', c.heroMuted, c.heroStart, 4.5],
    ['hero atenuado (fin)', c.heroMuted, c.heroEnd, 4.5],
    ['hero éxito', c.heroSuccess, c.heroEnd, 4.5],
    ['hero advertencia', c.heroWarning, c.heroEnd, 4.5],
    ['hero peligro', c.heroDanger, c.heroEnd, 4.5],
    ['tensión', c.voltage, c.surfaceMuted, 3],
    ['corriente', c.current, c.surfaceMuted, 3],
    ['frecuencia', c.frequency, c.surfaceMuted, 3],
    ['factor de potencia', c.powerFactor, c.surfaceMuted, 3],
  ];
}

describe.each([
  ['claro', lightTheme],
  ['oscuro', darkTheme],
])('contraste WCAG AA – tema %s', (_name, theme) => {
  it.each(textPairs(theme))('%s', (_label, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});

describe('utilidades de color', () => {
  it('withAlpha convierte hex a rgba', () => {
    expect(withAlpha('#0E7490', 0.12)).toBe('rgba(14,116,144,0.12)');
    expect(withAlpha('#fff', 1)).toBe('rgba(255,255,255,1)');
  });

  it('contraste de referencia blanco/negro = 21', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });
});

describe('resolveTheme', () => {
  it('respeta la preferencia del usuario y luego la del sistema', () => {
    expect(resolveTheme('dark', 'light')).toBe(darkTheme);
    expect(resolveTheme('light', 'dark')).toBe(lightTheme);
    expect(resolveTheme('system', 'dark')).toBe(darkTheme);
    expect(resolveTheme('system', null)).toBe(lightTheme);
  });
});
