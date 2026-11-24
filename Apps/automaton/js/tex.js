// KaTeX helpers. Everything with math on the page goes through these.

export function tex(s, display = false) {
  if (!window.katex) return s;
  return window.katex.renderToString(s, { throwOnError: false, displayMode: display });
}

// Inline math in a sentence: m`...` style helper for short pieces.
export const m = s => tex(s);
