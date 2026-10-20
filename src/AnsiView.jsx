import React, { useMemo } from 'react';

// Standard 16-color ANSI Palette
const ANSI_COLORS = {
  30: '#1e293b', // Black / Dark Slate
  31: '#ef4444', // Red
  32: '#10b981', // Green
  33: '#f59e0b', // Yellow
  34: '#3b82f6', // Blue
  35: '#a855f7', // Purple / Magenta
  36: '#00e5ff', // Cyan
  37: '#f8fafc', // White

  // High Intensity / Bright
  90: '#64748b', // Bright Black / Gray
  91: '#f87171', // Bright Red
  92: '#34d399', // Bright Green
  93: '#fbbf24', // Bright Yellow
  94: '#60a5fa', // Bright Blue
  95: '#c084fc', // Bright Purple
  96: '#67e8f9', // Bright Cyan
  97: '#ffffff', // Bright White
};

const ANSI_BG_COLORS = {
  40: '#0f172a',
  41: '#7f1d1d',
  42: '#064e3b',
  43: '#78350f',
  44: '#1e3a8a',
  45: '#581c87',
  46: '#164e63',
  47: '#334155',

  100: '#1e293b',
  101: '#991b1b',
  102: '#065f46',
  103: '#92400e',
  104: '#1e40af',
  105: '#6b21a8',
  106: '#155e75',
  107: '#475569',
};

export function stripAnsi(str) {
  if (!str) return '';
  // Strips standard \x1b[...m, unicode \u001b, codepage 437 arrow ←[...m, and boundary [...m
  return str
    .replace(/(?:\x1b|\u001b|←|\^\[)\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\[\d+(?:;\d+)*m/g, '');
}

export function parseAnsiToReact(rawText) {
  if (!rawText) return null;

  // Clean screen sequences
  let text = rawText
    .replace(/(?:\x1b|\u001b|←|\^\[)\[2J/g, '')
    .replace(/(?:\x1b|\u001b|←|\^\[)\[H/g, '');

  // Normalize all forms of escape prefix (\x1b, \u001b, ←, ^[) to standard \x1b
  text = text.replace(/(?:\u001b|←|\^\[)\[/g, '\x1b[');

  // Normalize cases where escape byte was stripped in Windows pipe leaving just "[32m" at boundary
  text = text.replace(/(^|[\s\r\n])\[(\d+(?:;\d+)*m)/g, '$1\x1b[$2');

  const regex = /\x1b\[([0-9;]*)m/g;
  const segments = [];
  let lastIndex = 0;

  // Active terminal style state
  let currentStyle = {
    color: null,
    backgroundColor: null,
    fontWeight: 'normal',
    textDecoration: 'none',
    opacity: 1
  };

  let match;
  while ((match = regex.exec(text)) !== null) {
    const textChunk = text.substring(lastIndex, match.index);
    if (textChunk) {
      segments.push({
        text: textChunk,
        style: { ...currentStyle }
      });
    }

    const codeStr = match[1];
    if (!codeStr || codeStr === '0') {
      // Reset
      currentStyle = {
        color: null,
        backgroundColor: null,
        fontWeight: 'normal',
        textDecoration: 'none',
        opacity: 1
      };
    } else {
      const codes = codeStr.split(';').map(c => parseInt(c, 10));
      for (let i = 0; i < codes.length; i++) {
        const c = codes[i];
        if (c === 0) {
          currentStyle = { color: null, backgroundColor: null, fontWeight: 'normal', textDecoration: 'none', opacity: 1 };
        } else if (c === 1) {
          currentStyle.fontWeight = 'bold';
        } else if (c === 2) {
          currentStyle.opacity = 0.7;
        } else if (c === 4) {
          currentStyle.textDecoration = 'underline';
        } else if (ANSI_COLORS[c]) {
          currentStyle.color = ANSI_COLORS[c];
        } else if (ANSI_BG_COLORS[c]) {
          currentStyle.backgroundColor = ANSI_BG_COLORS[c];
        } else if (c === 38 && codes[i + 1] === 2 && i + 4 < codes.length) {
          // Truecolor FG: 38;2;r;g;b
          const r = codes[i + 2];
          const g = codes[i + 3];
          const b = codes[i + 4];
          currentStyle.color = `rgb(${r}, ${g}, ${b})`;
          i += 4;
        } else if (c === 48 && codes[i + 1] === 2 && i + 4 < codes.length) {
          // Truecolor BG: 48;2;r;g;b
          const r = codes[i + 2];
          const g = codes[i + 3];
          const b = codes[i + 4];
          currentStyle.backgroundColor = `rgb(${r}, ${g}, ${b})`;
          i += 4;
        }
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Trailing chunk
  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    segments.push({
      text: remainingText,
      style: { ...currentStyle }
    });
  }

  return segments.map((seg, idx) => (
    <span
      key={idx}
      style={{
        color: seg.style.color || undefined,
        backgroundColor: seg.style.backgroundColor || undefined,
        fontWeight: seg.style.fontWeight !== 'normal' ? seg.style.fontWeight : undefined,
        textDecoration: seg.style.textDecoration !== 'none' ? seg.style.textDecoration : undefined,
        opacity: seg.style.opacity !== 1 ? seg.style.opacity : undefined
      }}
    >
      {seg.text}
    </span>
  ));
}

export default function AnsiView({ text, filter = '' }) {
  const renderedContent = useMemo(() => {
    if (!text) return null;
    if (!filter) return parseAnsiToReact(text);

    // Filter line by line if filter term exists
    const lines = text.split('\n');
    const filteredLines = lines.filter(l => stripAnsi(l).toLowerCase().includes(filter.toLowerCase()));
    return parseAnsiToReact(filteredLines.join('\n'));
  }, [text, filter]);

  return <>{renderedContent}</>;
}
