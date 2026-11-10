// Theme: colour presets, fonts and the CSS variables sent to the page.
const PRESETS = {
  gold: { label: "Midnight Gold (original)", bg: "#06080F", bg2: "#0A0F1F", accent: "#FFC83D", accent2: "#2F5BFF", text: "#EEF1F8", muted: "#9AA3B8",
    exact: { yellow2: "#FFDD73", yellow3: "#FFB020", yellowD: "#E59C00", blue2: "#6F8DFF", blue3: "#8EA6FF", blue4: "#A9BBFF", navy: "#12205C", text2: "#CDD3E2", text3: "#DFE4F0" } },
  ocean: { label: "Ocean Cyan", bg: "#04101A", bg2: "#071C2B", accent: "#22D3EE", accent2: "#3B82F6", text: "#E8F4FA", muted: "#8FA8B8" },
  emerald: { label: "Emerald", bg: "#04110C", bg2: "#08201A", accent: "#34D399", accent2: "#2563EB", text: "#ECF7F2", muted: "#93ACA2" },
  royal: { label: "Royal Purple", bg: "#0B0716", bg2: "#150D2A", accent: "#F5B942", accent2: "#8B5CF6", text: "#F1EDFA", muted: "#A79FBE" },
  sunset: { label: "Sunset Orange", bg: "#120806", bg2: "#1F0E0A", accent: "#FF7A45", accent2: "#FF3D6E", text: "#FBEFEA", muted: "#B9A19A" },
  mono: { label: "Black & White", bg: "#0A0A0A", bg2: "#151515", accent: "#FFFFFF", accent2: "#7C7C7C", text: "#F2F2F2", muted: "#A0A0A0" },
  light: { label: "Clean Light", bg: "#F7F8FC", bg2: "#ECEFF7", accent: "#F5A400", accent2: "#2F5BFF", text: "#1A2033", muted: "#5B6478" },
};

const HEADING_FONTS = {
  "Plus Jakarta Sans": "600;700;800", Poppins: "600;700;800", Montserrat: "600;700;800", Sora: "600;700;800",
  Outfit: "600;700;800", "Space Grotesk": "600;700", Syne: "600;700;800", Inter: "600;700;800",
  "Playfair Display": "600;700;800", "DM Serif Display": "400",
};
const BODY_FONTS = {
  Manrope: "400;500;600;700", Inter: "400;500;600;700", Poppins: "400;500;600;700", "DM Sans": "400;500;600;700",
  "Nunito Sans": "400;600;700", "Open Sans": "400;500;600;700", Lato: "400;700",
};
const SERIF = new Set(["Playfair Display", "DM Serif Display"]);

// ---- colour maths ----
const hex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); const n = parseInt(m ? m[1] : "000000", 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const lum = (h) => { const [r, g, b] = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

function palette(theme) {
  const p = theme.preset !== "custom" && PRESETS[theme.preset] ? PRESETS[theme.preset] : theme;
  const light = lum(p.bg) > 0.45;
  // the original theme keeps its hand-picked shades exactly, as long as its colours are untouched
  const exact = p.exact || {};
  return {
    light,
    bg: p.bg, bg2: p.bg2, text: p.text, muted: p.muted,
    yellow: p.accent, blue: p.accent2,
    yellow2: mix(p.accent, "#FFFFFF", 0.35),
    yellow3: mix(p.accent, "#000000", 0.08),
    yellowD: mix(p.accent, "#000000", 0.18),
    onAccent: lum(p.accent) > 0.4 ? "#111111" : "#FFFFFF",
    blue2: light ? mix(p.accent2, "#000000", 0.1) : mix(p.accent2, "#FFFFFF", 0.3),
    blue3: light ? mix(p.accent2, "#000000", 0.25) : mix(p.accent2, "#FFFFFF", 0.45),
    blue4: light ? mix(p.accent2, "#000000", 0.35) : mix(p.accent2, "#FFFFFF", 0.6),
    navy: mix(p.bg, p.accent2, light ? 0.14 : 0.3),
    heading: light ? "#0B1020" : "#FFFFFF",
    ink: light ? "#0B1020" : "#FFFFFF",
    text2: mix(p.text, p.muted, 0.39),
    text3: mix(p.text, p.muted, 0.18),
    ...exact,
  };
}

const RADIUS = { rounded: "20px", soft: "12px", sharp: "4px" };

function css(theme) {
  const c = palette(theme);
  const hf = HEADING_FONTS[theme.headingFont] ? theme.headingFont : "Plus Jakarta Sans";
  const bf = BODY_FONTS[theme.bodyFont] ? theme.bodyFont : "Manrope";
  const stack = (f) => `"${f}", ${SERIF.has(f) ? "Georgia, serif" : "system-ui, sans-serif"}`;
  return `:root{--bg:${c.bg};--bg-2:${c.bg2};--text:${c.text};--muted:${c.muted};--text-2:${c.text2};--text-3:${c.text3};--heading:${c.heading};--ink:${c.ink};` +
    `--yellow:${c.yellow};--yellow-2:${c.yellow2};--yellow-3:${c.yellow3};--yellow-d:${c.yellowD};--on-accent:${c.onAccent};` +
    `--blue:${c.blue};--blue-2:${c.blue2};--blue-3:${c.blue3};--blue-4:${c.blue4};--navy:${c.navy};--radius:${RADIUS[theme.corners] || "20px"};` +
    `--display:${stack(hf)};--body:${stack(bf)};color-scheme:${c.light ? "light" : "dark"}}`;
}

function fontsUrl(theme) {
  const hf = HEADING_FONTS[theme.headingFont] ? theme.headingFont : "Plus Jakarta Sans";
  const bf = BODY_FONTS[theme.bodyFont] ? theme.bodyFont : "Manrope";
  const fam = (f, w) => `family=${f.replace(/ /g, "+")}:wght@${w}`;
  const parts = hf === bf ? [fam(hf, "400;500;600;700;800")] : [fam(hf, HEADING_FONTS[hf]), fam(bf, BODY_FONTS[bf])];
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

const themeColor = (theme) => palette(theme).bg;

module.exports = { PRESETS, HEADING_FONTS, BODY_FONTS, css, fontsUrl, themeColor, palette };
