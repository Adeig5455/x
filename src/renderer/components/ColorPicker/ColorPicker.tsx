import React, { useState, useCallback, useMemo, useRef } from 'react';

// ============================================================================
// Color Picker - CSS inline editing with HSL/RGB/HEX, opacity, palettes
// ============================================================================

export interface ColorValue {
  r: number; g: number; b: number; a: number;
}

export interface ColorPickerProps {
  color: ColorValue;
  onChange: (color: ColorValue) => void;
  onClose: () => void;
  position: { top: number; left: number };
  recentColors?: string[];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): ColorValue | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16), a: 1 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
  };
}

const CSS_NAMED_COLORS: Record<string, string> = {
  red: '#ff0000', blue: '#0000ff', green: '#008000', yellow: '#ffff00',
  orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', white: '#ffffff',
  black: '#000000', gray: '#808080', cyan: '#00ffff', magenta: '#ff00ff',
  coral: '#ff7f50', teal: '#008080', navy: '#000080', lime: '#00ff00',
  gold: '#ffd700', salmon: '#fa8072', tomato: '#ff6347', violet: '#ee82ee',
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  onClose,
  position,
  recentColors = [],
}) => {
  const [mode, setMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [hexInput, setHexInput] = useState(rgbToHex(color.r, color.g, color.b));
  const canvasRef = useRef<HTMLDivElement>(null);

  const hsl = useMemo(() => rgbToHsl(color.r, color.g, color.b), [color.r, color.g, color.b]);
  const hex = useMemo(() => rgbToHex(color.r, color.g, color.b), [color.r, color.g, color.b]);

  const handleHueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const h = Number(e.target.value);
    const rgb = hslToRgb(h, hsl.s, hsl.l);
    onChange({ ...rgb, a: color.a });
  }, [hsl.s, hsl.l, color.a, onChange]);

  const handleSatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const s = Number(e.target.value);
    const rgb = hslToRgb(hsl.h, s, hsl.l);
    onChange({ ...rgb, a: color.a });
  }, [hsl.h, hsl.l, color.a, onChange]);

  const handleLightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const l = Number(e.target.value);
    const rgb = hslToRgb(hsl.h, hsl.s, l);
    onChange({ ...rgb, a: color.a });
  }, [hsl.h, hsl.s, color.a, onChange]);

  const handleAlphaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...color, a: Number(e.target.value) / 100 });
  }, [color, onChange]);

  const handleHexSubmit = useCallback(() => {
    const rgb = hexToRgb(hexInput);
    if (rgb) onChange({ ...rgb, a: color.a });
  }, [hexInput, color.a, onChange]);

  const handleRGBChange = useCallback((channel: 'r' | 'g' | 'b', value: number) => {
    onChange({ ...color, [channel]: Math.max(0, Math.min(255, value)) });
  }, [color, onChange]);

  const inputStyle: React.CSSProperties = {
    width: 50, padding: '2px 4px', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 2, color: 'var(--text-primary)',
    fontSize: 11, textAlign: 'center', outline: 'none',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: 260,
        background: 'var(--bg-secondary, #252526)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 1000,
        padding: 12,
      }}
    >
      {/* Color Preview Area */}
      <div ref={canvasRef} style={{
        width: '100%', height: 120, borderRadius: 4, marginBottom: 8,
        background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hsl.h}, 100%, 50%))`,
        position: 'relative', cursor: 'crosshair',
      }}>
        <div style={{
          position: 'absolute',
          left: `${hsl.s}%`, top: `${100 - hsl.l}%`,
          width: 12, height: 12, borderRadius: 6, border: '2px solid white',
          boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          transform: 'translate(-50%, -50%)',
          background: hex,
        }} />
      </div>

      {/* Hue slider */}
      <div style={{ marginBottom: 6 }}>
        <input
          type="range" min="0" max="360" value={Math.round(hsl.h)}
          onChange={handleHueChange}
          style={{
            width: '100%', height: 8, WebkitAppearance: 'none', appearance: 'none',
            borderRadius: 4, outline: 'none', cursor: 'pointer',
            background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          }}
        />
      </div>

      {/* Alpha slider */}
      <div style={{ marginBottom: 8 }}>
        <input
          type="range" min="0" max="100" value={Math.round(color.a * 100)}
          onChange={handleAlphaChange}
          style={{
            width: '100%', height: 8, WebkitAppearance: 'none', appearance: 'none',
            borderRadius: 4, outline: 'none', cursor: 'pointer',
            background: `linear-gradient(to right, transparent, ${hex})`,
          }}
        />
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {(['hex', 'rgb', 'hsl'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '2px 8px', borderRadius: 3, border: 'none', fontSize: 10, cursor: 'pointer',
            textTransform: 'uppercase', fontWeight: 600,
            background: mode === m ? 'var(--accent-color)' : 'transparent',
            color: mode === m ? '#fff' : 'var(--text-secondary)',
          }}>{m}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{
          width: 24, height: 24, borderRadius: 4,
          background: `rgba(${color.r},${color.g},${color.b},${color.a})`,
          border: '1px solid var(--border-color)',
        }} />
      </div>

      {/* Value inputs */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8 }}>
        {mode === 'hex' && (
          <input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={handleHexSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()}
            style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
          />
        )}
        {mode === 'rgb' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>R</div>
              <input type="number" min={0} max={255} value={color.r}
                onChange={(e) => handleRGBChange('r', Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>G</div>
              <input type="number" min={0} max={255} value={color.g}
                onChange={(e) => handleRGBChange('g', Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>B</div>
              <input type="number" min={0} max={255} value={color.b}
                onChange={(e) => handleRGBChange('b', Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>A</div>
              <input type="number" min={0} max={100} value={Math.round(color.a * 100)}
                onChange={(e) => onChange({ ...color, a: Number(e.target.value) / 100 })} style={inputStyle} />
            </div>
          </>
        )}
        {mode === 'hsl' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>H</div>
              <input type="number" min={0} max={360} value={Math.round(hsl.h)}
                onChange={handleHueChange} style={inputStyle} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>S</div>
              <input type="number" min={0} max={100} value={Math.round(hsl.s)}
                onChange={handleSatChange} style={inputStyle} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>L</div>
              <input type="number" min={0} max={100} value={Math.round(hsl.l)}
                onChange={handleLightChange} style={inputStyle} />
            </div>
          </>
        )}
      </div>

      {/* CSS string output */}
      <div style={{
        padding: '3px 8px', background: 'var(--bg-tertiary)', borderRadius: 3,
        fontFamily: 'monospace', fontSize: 10, color: '#ce9178', marginBottom: 8,
        textAlign: 'center',
      }}>
        {color.a < 1
          ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a.toFixed(2)})`
          : hex}
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Recent</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {recentColors.map((c, i) => (
              <div
                key={i}
                onClick={() => {
                  const rgb = hexToRgb(c);
                  if (rgb) onChange(rgb);
                }}
                style={{
                  width: 18, height: 18, borderRadius: 3, background: c, cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Named Colors */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Named Colors</div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {Object.entries(CSS_NAMED_COLORS).map(([name, hex]) => (
            <div
              key={name}
              onClick={() => {
                const rgb = hexToRgb(hex);
                if (rgb) onChange(rgb);
              }}
              style={{
                width: 18, height: 18, borderRadius: 3, background: hex, cursor: 'pointer',
                border: '1px solid var(--border-color)',
              }}
              title={name}
            />
          ))}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 4, right: 4, background: 'none', border: 'none',
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
        }}
      >×</button>
    </div>
  );
};
