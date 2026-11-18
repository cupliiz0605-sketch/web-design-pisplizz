import React, { useEffect, useRef, useState, useCallback } from 'react';

const SHEET_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261116_132032_30242d8c-5062-4d60-8a3d-238f0a2ff788.png&w=2200&q=85';
const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261116_131908_b6239896-c077-450c-ad91-575153973fcf.mp4';

const SW = 2688;
const SH = 1520;
const BH = (849 + 8) / (403 + 8);

interface Flavor {
  name: string;
  lines: string[];
  color: string;
  box: [number, number, number, number];
  bit: number;
  ingredients: string;
}

const FLAVORS: Flavor[] = [
  {
    name: 'Peanut Cocoa',
    lines: ['PEANUT', 'COCOA'],
    color: '#b79474',
    box: [98, 145, 403, 849],
    bit: 1,
    ingredients: 'Peanuts, oats, dates, cocoa, pea protein, sea salt.',
  },
  {
    name: 'Berry Oat',
    lines: ['BERRY', 'OAT'],
    color: '#ab9ac4',
    box: [620, 145, 402, 849],
    bit: 0,
    ingredients: 'Oats, blueberries, raspberries, dates, pea protein, almonds.',
  },
  {
    name: 'Salted Caramel',
    lines: ['SALTED', 'CARAMEL'],
    color: '#d1ad6c',
    box: [1137, 145, 402, 849],
    bit: 2,
    ingredients: 'Dates, cashews, oats, pea protein, sea salt, vanilla.',
  },
  {
    name: 'Mint Chip',
    lines: ['MINT', 'CHIP'],
    color: '#94bdb4',
    box: [1661, 145, 402, 849],
    bit: 3,
    ingredients: 'Oats, dark chocolate, almonds, pea protein, peppermint oil.',
  },
  {
    name: 'Strawberry',
    lines: ['STRAWBERRY'],
    color: '#d396a7',
    box: [2184, 145, 403, 849],
    bit: 4,
    ingredients: 'Oats, strawberries, dates, cashews, pea protein, lemon.',
  },
];

const BITS: [number, number, number, number][] = [
  [650, 1090, 340, 305],
  [110, 1125, 280, 255],
  [1175, 1110, 320, 285],
  [1680, 1085, 380, 305],
  [2280, 1095, 250, 295],
];

const HERO_BITS = [
  { x: 0.12, y: 0.2, size: 120, rot: -18, bit: 0, hidePhone: false },
  { x: 0.86, y: 0.18, size: 96, rot: 22, bit: 2, hidePhone: false },
  { x: 0.07, y: 0.74, size: 84, rot: 12, bit: 3, hidePhone: true },
  { x: 0.655, y: 0.15, size: 78, rot: -10, bit: 4, hidePhone: true },
  { x: 0.205, y: 0.885, size: 70, rot: 30, bit: 1, hidePhone: true },
];

const ARC_SLOTS = [
  { dx: 0, dy: 0, h: 430, rz: 0, ry: 0 },
  { dx: 245, dy: 24, h: 330, rz: 4, ry: 16 },
  { dx: 452, dy: 44, h: 312, rz: 8, ry: 26 },
  { dx: 660, dy: 80, h: 296, rz: 12, ry: 34 },
  { dx: 860, dy: 118, h: 280, rz: 15, ry: 40 },
];

const STEPS = [
  {
    num: '01',
    head: 'REAL FOOD,\nFIRST',
    cap: "Oats, nuts, fruit.\nNothing you can't say.",
    ry: 0,
  },
  {
    num: '02',
    head: 'PRESSED,\nNOT BAKED',
    cap: 'Real ingredients.\nClean energy.',
    ry: 180,
  },
  {
    num: '03',
    head: 'WRAPPED\nSAME DAY',
    cap: 'Cold-pressed at dawn.\nSealed by noon.',
    ry: 360,
  },
  {
    num: '04',
    head: '',
    cap: '12g plant protein.\nNo crash.',
    ry: 720,
  },
];

const NAV_ITEMS = [
  { id: 'flavors', label: 'Flavors' },
  { id: 'inside', label: 'Inside' },
  { id: 'shop', label: 'Shop' },
  { id: 'range', label: 'Range' },
];

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const dx = sampleDX(t);
      if (Math.abs(dx) < 1e-6) break;
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-5) return sampleY(t);
      t -= err / dx;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (lo < hi) {
      const val = sampleX(t);
      if (Math.abs(val - x) < 1e-5) break;
      if (x > val) lo = t;
      else hi = t;
      t = (lo + hi) * 0.5;
      if (hi - lo < 1e-5) break;
    }
    return sampleY(t);
  };
}

const GLIDE_CURVE = cubicBezier(0.25, 0.75, 0.2, 1);
const ENTRANCE_CURVE = cubicBezier(0.16, 1, 0.3, 1);

function sprStyle(box: [number, number, number, number], pad: number): React.CSSProperties {
  const x = box[0] - pad;
  const y = box[1] - pad;
  const w = box[2] + 2 * pad;
  const h = box[3] + 2 * pad;
  return {
    backgroundSize: `${(SW / w) * 100}% ${(SH / h) * 100}%`,
    backgroundPosition: `${(x / (SW - w)) * 100}% ${(y / (SH - h)) * 100}%`,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function mixHex(hexA: string, hexB: string, ratioB: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const r = Math.round(lerp(r1, r2, ratioB));
  const g = Math.round(lerp(g1, g2, ratioB));
  const b = Math.round(lerp(b1, b2, ratioB));
  return `rgb(${r}, ${g}, ${b})`;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function buildBarTextures(
  THREE: any,
  img: HTMLImageElement,
  flavour: Flavor,
  index: number
) {
  const [bx, by, bw, bh] = flavour.box;
  const cw = Math.round((bw + 8) * 1.5 * 0.75);
  const ch = Math.round(cw * BH);
  const scale = img.naturalWidth / SW;
  const sx = (bx - 4) * scale;
  const sy = (by - 4) * scale;
  const sw = (bw + 8) * scale;
  const sh = (bh + 8) * scale;

  // Front texture
  const fCanvas = document.createElement('canvas');
  fCanvas.width = cw;
  fCanvas.height = ch;
  const fCtx = fCanvas.getContext('2d')!;
  fCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  const frontTex = new THREE.CanvasTexture(fCanvas);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = 8;
  frontTex.needsUpdate = true;

  // Back texture
  const bCanvas = document.createElement('canvas');
  bCanvas.width = cw;
  bCanvas.height = ch;
  const bCtx = bCanvas.getContext('2d')!;

  // 1. Mirrored silhouette
  bCtx.save();
  bCtx.translate(cw, 0);
  bCtx.scale(-1, 1);
  bCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  bCtx.restore();

  // 2. Flavour color fill inside silhouette
  const sealH = ch * 0.075;
  bCtx.globalCompositeOperation = 'source-atop';
  bCtx.fillStyle = hexWithAlpha(flavour.color, 0.9);
  bCtx.fillRect(0, sealH, cw, ch - 2 * sealH);
  bCtx.fillStyle = hexWithAlpha(flavour.color, 0.35);
  bCtx.fillRect(0, 0, cw, sealH);
  bCtx.fillRect(0, ch - sealH, cw, sealH);

  // 3. Horizontal sheen gradient
  const grad = bCtx.createLinearGradient(0, 0, cw, 0);
  grad.addColorStop(0, 'rgba(0,0,0,.10)');
  grad.addColorStop(0.28, 'rgba(255,255,255,.14)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0)');
  grad.addColorStop(0.8, 'rgba(0,0,0,.04)');
  grad.addColorStop(1, 'rgba(0,0,0,.14)');
  bCtx.fillStyle = grad;
  bCtx.fillRect(0, sealH, cw, ch - 2 * sealH);

  // 4. Text & panels (clipped inside silhouette via source-atop)
  const ink = mixHex(flavour.color, '#1c1a1f', 0.78);
  bCtx.fillStyle = ink;
  bCtx.textAlign = 'center';
  bCtx.textBaseline = 'middle';

  bCtx.font = `400 ${0.085 * cw}px "Archivo Black", sans-serif`;
  bCtx.fillText('STRIDE', cw * 0.5, ch * 0.15);

  bCtx.font = `500 ${0.042 * cw}px "DM Mono", monospace`;
  bCtx.fillText(`${flavour.name.toUpperCase()} · 50 G`, cw * 0.5, ch * 0.185);

  // Nutrition panel
  const px = cw * 0.15;
  const py = ch * 0.215;
  const pw = cw * 0.7;
  const ph = ch * 0.36;
  bCtx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  roundRectPath(bCtx, px, py, pw, ph, cw * 0.03);
  bCtx.fill();

  const innerL = cw * 0.19;
  const innerR = cw * 0.81;
  bCtx.fillStyle = ink;
  bCtx.textAlign = 'left';
  bCtx.font = `400 ${0.058 * cw}px "Archivo Black", sans-serif`;
  bCtx.fillText('NUTRITION', innerL, ch * 0.252);

  bCtx.font = `400 ${0.032 * cw}px "DM Mono", monospace`;
  bCtx.fillStyle = ink;
  bCtx.globalAlpha = 0.78;
  bCtx.fillText('Serving size 1 bar (50 g)', innerL, ch * 0.285);
  bCtx.globalAlpha = 1;

  // Solid rule
  bCtx.strokeStyle = ink;
  bCtx.lineWidth = Math.max(1.5, cw * 0.005);
  bCtx.beginPath();
  bCtx.moveTo(innerL, ch * 0.305);
  bCtx.lineTo(innerR, ch * 0.305);
  bCtx.stroke();

  const rows: [string, string, number][] = [
    ['Calories', '210', 500],
    ['Protein', '12 g', 500],
    ['Total fat', '9 g', 400],
    ['Carbohydrate', '22 g', 400],
    ['Fibre', '6 g', 400],
    ['Sugars', '8 g', 400],
    ['Salt', '0.2 g', 400],
  ];

  rows.forEach(([label, val, weight], ri) => {
    const ry = ch * (0.332 + ri * 0.034);
    bCtx.font = `${weight} ${0.032 * cw}px "DM Mono", monospace`;
    bCtx.fillStyle = ink;
    bCtx.textAlign = 'left';
    bCtx.fillText(label, innerL, ry);
    bCtx.textAlign = 'right';
    bCtx.fillText(val, innerR, ry);

    if (ri < rows.length - 1) {
      bCtx.save();
      bCtx.globalAlpha = 0.18;
      bCtx.lineWidth = Math.max(1, cw * 0.002);
      bCtx.beginPath();
      bCtx.moveTo(innerL, ry + ch * 0.017);
      bCtx.lineTo(innerR, ry + ch * 0.017);
      bCtx.stroke();
      bCtx.restore();
    }
  });

  // Ingredients
  bCtx.textAlign = 'left';
  bCtx.fillStyle = ink;
  bCtx.font = `500 ${0.036 * cw}px "DM Mono", monospace`;
  bCtx.fillText('INGREDIENTS', cw * 0.15, ch * 0.62);

  bCtx.font = `400 ${0.034 * cw}px "DM Mono", monospace`;
  const words = flavour.ingredients.split(' ');
  const maxW = cw * 0.7;
  let line = '';
  let ly = ch * 0.65;
  for (let wi = 0; wi < words.length; wi++) {
    const test = line ? `${line} ${words[wi]}` : words[wi];
    if (bCtx.measureText(test).width > maxW && line) {
      bCtx.fillText(line, cw * 0.15, ly);
      line = words[wi];
      ly += ch * 0.022;
    } else {
      line = test;
    }
  }
  if (line) bCtx.fillText(line, cw * 0.15, ly);

  // Barcode card
  const bcW = cw * 0.54;
  const bcH = ch * 0.105;
  const bcX = (cw - bcW) * 0.5;
  const bcY = ch * 0.735;
  bCtx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  roundRectPath(bCtx, bcX, bcY, bcW, bcH, cw * 0.02);
  bCtx.fill();

  const rand = seededRand(9187 + index * 131);
  bCtx.fillStyle = ink;
  let cxPos = bcX + bcW * 0.08;
  const barEnd = bcX + bcW * 0.92;
  const barTop = bcY + bcH * 0.15;
  const barBot = bcY + bcH * 0.72;
  while (cxPos < barEnd) {
    const bwBar = (0.012 + rand() * 0.026) * bcW;
    const gap = (0.01 + rand() * 0.022) * bcW;
    if (cxPos + bwBar <= barEnd) {
      bCtx.fillRect(cxPos, barTop, bwBar, barBot - barTop);
    }
    cxPos += bwBar + gap;
  }
  bCtx.font = `400 ${0.025 * cw}px "DM Mono", monospace`;
  bCtx.textAlign = 'center';
  bCtx.fillText(`5 060942 8801${index}6`, cw * 0.5, bcY + bcH * 0.86);

  // Footer slogan
  bCtx.font = `500 ${0.036 * cw}px "DM Mono", monospace`;
  bCtx.textAlign = 'center';
  bCtx.fillText('PRESSED, NOT BAKED', cw * 0.5, ch * 0.885);

  bCtx.globalCompositeOperation = 'source-over';

  const backTex = new THREE.CanvasTexture(bCanvas);
  backTex.colorSpace = THREE.SRGBColorSpace;
  backTex.anisotropy = 8;
  backTex.needsUpdate = true;

  return { frontTex, backTex };
}

function buildBarGeometries(THREE: any) {
  const segX = 30;
  const segY = 64;
  const frontGeo = new THREE.PlaneGeometry(1, BH, segX, segY);
  const backGeo = new THREE.PlaneGeometry(1, BH, segX, segY);

  const fPos = frontGeo.attributes.position;
  const fUv = frontGeo.attributes.uv;
  const bPos = backGeo.attributes.position;
  const bUv = backGeo.attributes.uv;

  const CR = 0.062;
  for (let i = 0; i < fPos.count; i++) {
    const u = fUv.getX(i);
    const v = fUv.getY(i);
    const ex = Math.abs(2 * u - 1);
    const ev = Math.min(v, 1 - v);

    let z = 0;
    if (ev < CR) {
      z = 0.006 + 0.006 * Math.abs(Math.sin(u * Math.PI * 34));
    } else {
      const across = Math.pow(Math.max(0, 1 - Math.pow(ex, 2.6)), 0.62);
      const along = Math.pow(clamp((ev - CR) / 0.11, 0, 1), 0.7);
      z = 0.012 + 0.118 * across * along + 0.004 * Math.sin(23 * u + 31 * v) * across;
    }

    fPos.setZ(i, z);
    bPos.setZ(i, -z);
    bUv.setX(i, 1 - u);
  }

  // Reverse triangle winding on backGeo
  const idx = backGeo.getIndex();
  if (idx) {
    const arr = idx.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = tmp;
    }
    idx.needsUpdate = true;
  }

  frontGeo.computeVertexNormals();
  backGeo.computeVertexNormals();

  // Contact shadow texture
  const sCanvas = document.createElement('canvas');
  sCanvas.width = 128;
  sCanvas.height = 256;
  const sCtx = sCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 128, 6, 64, 128, 62);
  sGrad.addColorStop(0, 'rgba(30, 18, 40, 0.55)');
  sGrad.addColorStop(0.55, 'rgba(30, 18, 40, 0.22)');
  sGrad.addColorStop(1, 'rgba(30, 18, 40, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 256);

  const shadowTex = new THREE.CanvasTexture(sCanvas);
  shadowTex.colorSpace = THREE.SRGBColorSpace;
  const shadowGeo = new THREE.PlaneGeometry(1.25, 1.04 * BH);

  return { frontGeo, backGeo, shadowGeo, shadowTex };
}

interface BarState {
  x: number;
  y: number;
  h: number;
  rz: number;
  ry: number;
  rx: number;
  z: number;
  op: number;
  sx: number;
  sy: number;
  shadow: number;
}

function lerpBarState(a: BarState, b: BarState, t: number): BarState {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    h: lerp(a.h, b.h, t),
    rz: lerp(a.rz, b.rz, t),
    ry: lerp(a.ry, b.ry, t),
    rx: lerp(a.rx, b.rx, t),
    z: lerp(a.z, b.z, t),
    op: lerp(a.op, b.op, t),
    sx: lerp(a.sx, b.sx, t),
    sy: lerp(a.sy, b.sy, t),
    shadow: lerp(a.shadow, b.shadow, t),
  };
}

function measureTextWidth(text: string, font: string): number {
  const c = measureTextWidth as unknown as { canvas?: HTMLCanvasElement };
  if (!c.canvas) c.canvas = document.createElement('canvas');
  const ctx = c.canvas.getContext('2d')!;
  ctx.font = font;
  return ctx.measureText(text).width;
}

interface StormSeed {
  bitIdx: number;
  angle: number;
  phase: number;
  spin: number;
  sizeFactor: number;
}

function buildStormSeeds(): StormSeed[] {
  const rand = seededRand(4207);
  const seeds: StormSeed[] = [];
  for (let i = 0; i < 20; i++) {
    seeds.push({
      bitIdx: i % 10 < 7 ? -1 : Math.floor(rand() * 5),
      angle: rand() * Math.PI * 2,
      phase: i / 20 + rand() * 0.03,
      spin: (rand() > 0.5 ? 1 : -1) * (260 + rand() * 140),
      sizeFactor: 0.7 + rand() * 0.7,
    });
  }
  return seeds;
}

const STORM_SEEDS = buildStormSeeds();

interface CartItem {
  id: string;
  label: string;
  price: number;
  qty: number;
  color: string;
  flavIdx: number;
}

export default function App() {
  // React UI state
  const [introPhase, setIntroPhase] = useState<'video' | 'logo' | 'done'>(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'done'
      : 'video'
  );
  const [heroEntered, setHeroEntered] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [activeFlavour, setActiveFlavour] = useState(1);
  const [counterDisplay, setCounterDisplay] = useState('02');
  const [titleState, setTitleState] = useState<{
    name: string;
    key: number;
    dir: number;
    animate: boolean;
  }>({ name: FLAVORS[1].name, key: 0, dir: 1, animate: false });
  const [exitingTitle, setExitingTitle] = useState<{
    name: string;
    key: number;
    dir: number;
  } | null>(null);
  const exitingTitleRef = useRef<HTMLSpanElement>(null);
  const titleExitTimerRef = useRef<number | undefined>(undefined);
  const [titleFontSize, setTitleFontSize] = useState<string>('');
  const [autoplay, setAutoplay] = useState(() =>
    typeof window !== 'undefined'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : true
  );

  // Section 2 state
  const [stepIdx, setStepIdx] = useState(0);
  const [displayStep, setDisplayStep] = useState(0);
  const [stepFlavName, setStepFlavName] = useState(FLAVORS[1].name);
  const [inTextFading, setInTextFading] = useState<'idle' | 'out' | 'in'>('idle');

  // Section 3 & 4 state
  const [shopRevealed, setShopRevealed] = useState(false);
  const [rangeRevealed, setRangeRevealed] = useState(false);
  const [packSlots, setPackSlots] = useState<(number | null)[]>([null, null, null]);
  const [glowColor, setGlowColor] = useState('rgba(148, 189, 180, 0.72)');
  const [glowPulseKey, setGlowPulseKey] = useState(0);
  const [buyAdded, setBuyAdded] = useState(false);

  // Nav & Cart state
  const [activeNav, setActiveNav] = useState('flavors');
  const [navTheme, setNavTheme] = useState<'default' | 'light' | 'dark'>('default');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [badgePopKey, setBadgePopKey] = useState(0);
  const [bagBumpKey, setBagBumpKey] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [dibsOpen, setDibsOpen] = useState(false);
  const [dibsEmail, setDibsEmail] = useState('');
  const [dibsSent, setDibsSent] = useState(false);

  // Refs for DOM elements & animation runtime
  const introRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navPillRef = useRef<HTMLDivElement>(null);
  const navHiRef = useRef<HTMLDivElement>(null);
  const navLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const navBagRef = useRef<HTMLButtonElement>(null);

  const heroRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const bitRefs = useRef<(HTMLDivElement | null)[]>([]);

  const insideRef = useRef<HTMLElement>(null);
  const inDarkRef = useRef<HTMLDivElement>(null);
  const inBackFrameRef = useRef<HTMLDivElement>(null);
  const inFrontRef = useRef<HTMLDivElement>(null);
  const inFrontFrameRef = useRef<HTMLDivElement>(null);
  const inBarRef = useRef<HTMLDivElement>(null);
  const inNumRef = useRef<HTMLDivElement>(null);
  const stormPieceRefs = useRef<(HTMLDivElement | null)[]>([]);

  const shopRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pkRefs = useRef<(HTMLDivElement | null)[]>([]);

  const rangeRef = useRef<HTMLElement>(null);
  const slotSprRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mutable animation state ref (never triggers React re-render per frame)
  const animRef = useRef({
    pos: -2.6,
    target: 1,
    activeFlav: 1,
    heroEntered: false,
    reduced: false,
    autoplay: true,
    lastInteract: performance.now(),
    isDragging: false,
    heroVisibleRatio: 1,
    tabVisible: true,

    // Slide tween
    slide: null as null | {
      from: number;
      to: number;
      start: number;
      dur: number;
      triggered12: boolean;
      newFlav: number;
      dir: number;
      isEntrance?: boolean;
    },

    // Color reveal
    reveal: null as null | {
      color: string;
      start: number;
      dur: number;
      cx: number;
      cy: number;
      R: number;
    },

    // Section 2 flip
    curStep: 0,
    flipRy: 0,
    flipTween: null as null | {
      from: number;
      to: number;
      start: number;
      dur: number;
      targetStep: number;
      textSwapped: boolean;
    },

    // Card tilt & poke
    tilts: FLAVORS.map(() => ({ x: 0, y: 0 })),
    poke: null as null | { start: number; dur: number; cardIdx: number },
    phoneScrolledToCard: false,

    // Smooth scroll
    scrollTarget: 0,
    scrollCur: 0,
    smoothScrolling: false,

    // Builder touch flag
    packTouched: false,
    packAutoFilled: false,
  });

  // Sync refs with React state
  useEffect(() => {
    animRef.current.autoplay = autoplay;
  }, [autoplay]);

  useEffect(() => {
    animRef.current.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (animRef.current.reduced) {
      animRef.current.pos = 1;
      animRef.current.target = 1;
      animRef.current.heroEntered = true;
      document.body.classList.remove('locked');
    }
  }, []);

  // Compute responsive hero title font size
  const computeTitleFontSize = useCallback((name: string) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (vw < 820) {
      if (vw > vh || vh <= 500) {
        setTitleFontSize('36px');
        return;
      }
      const words = name.toUpperCase().split(' ');
      let maxW = 0;
      for (const w of words) {
        const mw = measureTextWidth(w, '400 100px "Archivo Black", sans-serif');
        if (mw > maxW) maxW = mw;
      }
      const base = clamp(vw * 0.125, 40, 64);
      const fit = maxW > 0 ? ((vw - 36) * 100) / maxW : base;
      setTitleFontSize(`${Math.min(base, fit)}px`);
    } else {
      const u = Math.min(vw / 1440, vh / 900);
      const w = measureTextWidth(name.toUpperCase(), '400 100px "Archivo Black", sans-serif');
      const base = 96 * u;
      const fit = w > 0 ? (760 * u * 100) / w : base;
      setTitleFontSize(`${Math.min(base, fit)}px`);
    }
  }, []);

  // Enter hero helper
  const enterHero = useCallback(() => {
    const st = animRef.current;
    if (st.heroEntered) return;
    st.heroEntered = true;
    st.lastInteract = performance.now();
    document.body.classList.remove('locked');
    setIntroPhase('done');
    setHeroEntered(true);

    if (st.reduced) {
      st.pos = 1;
      st.target = 1;
      st.slide = null;
    } else {
      st.pos = -2.6;
      st.target = 1;
      st.slide = {
        from: -2.6,
        to: 1,
        start: performance.now(),
        dur: 1700,
        triggered12: true,
        newFlav: 1,
        dir: 1,
        isEntrance: true,
      };
    }

    // Start floating bits entrance + infinite drift
    HERO_BITS.forEach((b, i) => {
      const el = bitRefs.current[i];
      if (!el) return;
      if (st.reduced) {
        el.style.opacity = '0.55';
        return;
      }
      el.animate([{ opacity: 0 }, { opacity: 0.6 }], {
        duration: 900,
        delay: 300 + 90 * i,
        fill: 'forwards',
        easing: 'ease-out',
      });
      const dx = (i % 2 === 0 ? 1 : -1) * (12 + (i % 3));
      const dy = -(22 + 3 * i);
      const dr = (i % 2 === 0 ? 1 : -1) * (10 + (i % 3));
      el.animate(
        [
          { transform: 'translate(0px, 0px) rotate(0deg)' },
          { transform: `translate(${dx}px, ${dy}px) rotate(${dr}deg)` },
        ],
        {
          composite: 'add',
          duration: 7000 + 900 * i,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out',
        }
      );
    });

    document.fonts.ready.then(() => {
      computeTitleFontSize(FLAVORS[st.activeFlav].name);
    });
  }, [computeTitleFontSize]);

  // Intro video & logo sequence
  useEffect(() => {
    if (animRef.current.reduced) {
      enterHero();
      return;
    }
    const vid = videoRef.current;
    if (!vid) return;

    let logoShown = false;
    let started = false;
    let tLogo: number | undefined;
    let tEnter: number | undefined;
    let tNoStart: number | undefined;
    let tFailsafe: number | undefined;

    const triggerLogo = () => {
      if (logoShown || animRef.current.heroEntered) return;
      logoShown = true;
      window.clearTimeout(tLogo);
      window.clearTimeout(tNoStart);
      try {
        vid.pause();
      } catch {}
      setIntroPhase('logo');
      tEnter = window.setTimeout(() => {
        enterHero();
      }, 380 + 650);
    };

    const startPlayback = () => {
      if (started || logoShown) return;
      started = true;
      window.clearTimeout(tNoStart);
      try {
        vid.currentTime = 0.55;
      } catch {}
      const p = vid.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => triggerLogo());
      }
      tLogo = window.setTimeout(triggerLogo, 4050);
    };

    const onTimeUpdate = () => {
      if (vid.currentTime >= 4.6) {
        triggerLogo();
      }
    };

    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('ended', triggerLogo);
    vid.addEventListener('error', triggerLogo);

    if (vid.readyState >= 3) {
      startPlayback();
    } else {
      vid.addEventListener('canplay', startPlayback, { once: true });
    }

    tNoStart = window.setTimeout(() => {
      if (!started) triggerLogo();
    }, 3500);

    tFailsafe = window.setTimeout(() => {
      enterHero();
    }, 9000);

    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('ended', triggerLogo);
      vid.removeEventListener('error', triggerLogo);
      vid.removeEventListener('canplay', startPlayback);
      window.clearTimeout(tLogo);
      window.clearTimeout(tEnter);
      window.clearTimeout(tNoStart);
      window.clearTimeout(tFailsafe);
    };
  }, [enterHero]);

  // Apply flavour change effects (circle reveal, title, counter, section 2 step 04)
  const triggerFlavourEffects = useCallback(
    (newFlav: number, dir: number) => {
      const st = animRef.current;
      const oldFlav = st.activeFlav;
      if (oldFlav === newFlav) return;
      st.activeFlav = newFlav;
      setActiveFlavour(newFlav);

      const newColor = FLAVORS[newFlav].color;
      const newName = FLAVORS[newFlav].name;

      // Finish any running reveal immediately
      if (st.reveal) {
        document.documentElement.style.setProperty('--flav', st.reveal.color);
        if (revealRef.current) {
          revealRef.current.style.setProperty('--rv', 'transparent');
          revealRef.current.style.maskImage = '';
          revealRef.current.style.webkitMaskImage = '';
        }
        st.reveal = null;
      }

      if (st.reduced) {
        document.documentElement.style.setProperty('--flav', newColor);
        setTitleState((prev) => ({
          name: newName,
          key: prev.key + 1,
          dir,
          animate: false,
        }));
        setCounterDisplay(`0${newFlav + 1}`);
        computeTitleFontSize(newName);
      } else {
        // Feathered circle reveal
        const heroEl = heroRef.current;
        const vw = window.innerWidth;
        const heroH = heroEl ? heroEl.clientHeight : window.innerHeight;
        const isPhone = vw < 820;
        const u = isPhone
          ? Math.min(vw / 560, heroH / 980)
          : Math.min(vw / 1440, window.innerHeight / 900);
        const cx = vw / 2;
        const cy = isPhone ? heroH * 0.4 : heroH / 2 - 78 * u;
        const R =
          1.45 *
          Math.max(
            Math.hypot(cx, cy),
            Math.hypot(vw - cx, cy),
            Math.hypot(cx, heroH - cy),
            Math.hypot(vw - cx, heroH - cy)
          );

        if (revealRef.current) {
          revealRef.current.style.setProperty('--rv', newColor);
        }
        st.reveal = {
          color: newColor,
          start: performance.now(),
          dur: 420,
          cx,
          cy,
          R,
        };

        // Title letter-rise with fade
        computeTitleFontSize(newName);
        window.clearTimeout(titleExitTimerRef.current);
        setTitleState((prev) => {
          setExitingTitle({ name: prev.name, key: prev.key, dir });
          return {
            name: newName,
            key: prev.key + 1,
            dir,
            animate: true,
          };
        });
        titleExitTimerRef.current = window.setTimeout(() => {
          setExitingTitle(null);
        }, 480);

        // Counter soft crossfade
        const cEl = countRef.current;
        if (cEl) {
          cEl.animate(
            [
              { translate: '0 0', opacity: 1 },
              { translate: '0 -10px', opacity: 0 },
            ],
            { duration: 220, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }
          );
          window.setTimeout(() => {
            setCounterDisplay(`0${newFlav + 1}`);
            cEl.animate(
              [
                { translate: '0 14px', opacity: 0 },
                { translate: '0 0', opacity: 1 },
              ],
              { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
            );
          }, 60);
        } else {
          setCounterDisplay(`0${newFlav + 1}`);
        }
      }

      // If Section 2 is on step 04, update its headline with crossfade
      if (st.curStep === 3) {
        setInTextFading('out');
        window.setTimeout(() => {
          setStepFlavName(newName);
          setInTextFading('in');
          window.setTimeout(() => setInTextFading('idle'), 460);
        }, 200);
      }
    },
    [computeTitleFontSize]
  );

  const goTo = useCallback(
    (newTarget: number, customDur?: number) => {
      const st = animRef.current;
      st.lastInteract = performance.now();
      const dir = newTarget >= st.target ? 1 : -1;
      const newFlav = ((newTarget % 5) + 5) % 5;
      const delta = Math.abs(newTarget - st.pos);
      st.target = newTarget;

      if (st.reduced) {
        st.pos = newTarget;
        st.slide = null;
        triggerFlavourEffects(newFlav, dir);
        return;
      }

      const dur = customDur ?? 650 + Math.max(0, delta - 1) * 160;
      st.slide = {
        from: st.pos,
        to: newTarget,
        start: performance.now(),
        dur,
        triggered12: false,
        newFlav,
        dir,
      };
    },
    [triggerFlavourEffects]
  );

  // Title letter animation effect whenever titleState changes
  useEffect(() => {
    const h1 = titleRef.current;
    if (!h1 || !titleState.animate || animRef.current.reduced) return;

    const enterLayer = h1.querySelector('.title-layer.entering');
    const chars = Array.from((enterLayer || h1).querySelectorAll('.char')) as HTMLElement[];
    const dir = titleState.dir;
    chars.forEach((ch, idx) => {
      ch.animate(
        [
          { transform: `translateY(${dir * 110}%)`, opacity: 0 },
          { transform: 'translateY(0%)', opacity: 1 },
        ],
        {
          duration: 620,
          delay: 120 + 22 * idx,
          easing: 'cubic-bezier(.22,1,.36,1)',
          fill: 'both',
        }
      );
    });
  }, [titleState]);

  useEffect(() => {
    const exitLayer = exitingTitleRef.current;
    if (!exitLayer || !exitingTitle || animRef.current.reduced) return;
    const chars = Array.from(exitLayer.querySelectorAll('.char')) as HTMLElement[];
    const dir = exitingTitle.dir;
    chars.forEach((ch, idx) => {
      ch.animate(
        [
          { transform: 'translateY(0%)', opacity: 1 },
          { transform: `translateY(${dir * -110}%)`, opacity: 0 },
        ],
        {
          duration: 300,
          delay: 11 * idx,
          easing: 'cubic-bezier(.45,0,.75,.3)',
          fill: 'forwards',
        }
      );
    });
  }, [exitingTitle]);

  // Title sizing on resize & font load
  useEffect(() => {
    const updateSize = () => computeTitleFontSize(FLAVORS[animRef.current.activeFlav].name);
    updateSize();
    document.fonts.ready.then(updateSize);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [computeTitleFontSize]);

  // Nav pill highlight positioning
  const updateNavHighlight = useCallback((id: string) => {
    const idx = NAV_ITEMS.findIndex((n) => n.id === id);
    const link = navLinkRefs.current[idx];
    const hi = navHiRef.current;
    if (!link || !hi) return;
    hi.style.left = `${link.offsetLeft}px`;
    hi.style.width = `${link.offsetWidth}px`;
  }, []);

  useEffect(() => {
    updateNavHighlight(activeNav);
    const onResize = () => updateNavHighlight(activeNav);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeNav, updateNavHighlight]);

  // Autoplay interval
  useEffect(() => {
    const onVis = () => {
      animRef.current.tabVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVis);

    const id = window.setInterval(() => {
      const st = animRef.current;
      if (
        !st.heroEntered ||
        !st.autoplay ||
        st.reduced ||
        st.isDragging ||
        !st.tabVisible ||
        st.heroVisibleRatio < 0.6
      ) {
        return;
      }
      if (performance.now() - st.lastInteract >= 3200) {
        goTo(st.target + 1);
      }
    }, 250);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(id);
    };
  }, [goTo]);

  // Keyboard arrows when hero >= 50% in view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = animRef.current;
      if (!st.heroEntered || st.heroVisibleRatio < 0.5) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(st.target + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(st.target - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo]);

  // IntersectionObservers for hero visibility, shop reveal, range reveal & autofill
  useEffect(() => {
    const heroEl = heroRef.current;
    const shopEl = shopRef.current;
    const rangeEl = rangeRef.current;

    const heroObs = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          animRef.current.heroVisibleRatio = entries[0].intersectionRatio;
        }
      },
      { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] }
    );
    if (heroEl) heroObs.observe(heroEl);

    const shopObs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShopRevealed(true);
          shopObs.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    if (shopEl) shopObs.observe(shopEl);

    const rangeObs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRangeRevealed(true);
          const st = animRef.current;
          if (!st.packTouched && !st.packAutoFilled) {
            st.packAutoFilled = true;
            const base = st.activeFlav;
            const picks = [base, (base + 1) % 5, (base + 2) % 5];
            [250, 410, 570].forEach((delay, slotIdx) => {
              window.setTimeout(() => {
                if (animRef.current.packTouched) return;
                setPackSlots((prev) => {
                  const next = [...prev];
                  next[slotIdx] = picks[slotIdx];
                  return next;
                });
                setGlowColor(hexWithAlpha(FLAVORS[picks[slotIdx]].color, 0.72));
                setGlowPulseKey((k) => k + 1);
              }, delay);
            });
          }
        }
      },
      { threshold: 0.3 }
    );
    if (rangeEl) rangeObs.observe(rangeEl);

    return () => {
      heroObs.disconnect();
      shopObs.disconnect();
      rangeObs.disconnect();
    };
  }, []);

  // Main Three.js + Frame Loop + Drag/Raycast + Smooth Scroll
  useEffect(() => {
    const canvas = document.getElementById('gl') as HTMLCanvasElement | null;
    if (!canvas) return;

    let disposed = false;
    let rafId = 0;
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let THREE_MOD: any = null;
    let raycaster: any = null;
    let frontGeo: any = null;
    let backGeo: any = null;
    let shadowGeo: any = null;
    let shadowTex: any = null;
    let envRT: any = null;

    const flavorTextures: { frontTex: any; backTex: any }[] = [];
    const poolBars: any[] = [];
    let travellerBar: any = null;

    const getHeroMetrics = (vw: number, vh: number) => {
      const heroH = heroRef.current ? heroRef.current.clientHeight : vh;
      const isPhone = vw < 820;
      const u = isPhone
        ? Math.min(vw / 560, heroH / 980)
        : Math.min(vw / 1440, vh / 900);
      const cx = vw / 2;
      const cy = isPhone ? heroH * 0.4 : heroH / 2 - 78 * u;
      const xSpread = isPhone ? 1.02 : 1;
      return { u, cx, cy, xSpread, heroH };
    };

    const getArcState = (
      k: number,
      j: number,
      now: number,
      vw: number,
      vh: number,
      reduced: boolean
    ): BarState => {
      const { u, cx, cy, xSpread } = getHeroMetrics(vw, vh);
      const absK = Math.min(Math.abs(k), 4);
      const sign = k < 0 ? -1 : 1;
      const i0 = Math.floor(absK);
      const i1 = Math.min(4, i0 + 1);
      const frac = absK - i0;

      const s0 = ARC_SLOTS[i0];
      const s1 = ARC_SLOTS[i1];
      const dx = lerp(s0.dx, s1.dx, frac) * sign;
      const dy = lerp(s0.dy, s1.dy, frac);
      const h = lerp(s0.h, s1.h, frac) * u;
      const rzBase = lerp(s0.rz, s1.rz, frac) * sign;
      const ry = lerp(s0.ry, s1.ry, frac) * sign;

      let x = cx + dx * xSpread * u;
      let y = cy + dy * u;
      let rz = rzBase;
      const z = -absK * 34 * u;
      const op = absK <= 3.3 ? 1 : clamp(1 - (absK - 3.3) / 0.6, 0, 1);

      if (!reduced) {
        const b = Math.sin((now / 4600) * Math.PI * 2 + 1.37 * j);
        y -= (0.5 * b + 0.5) * 9 * u;
        rz += 0.4 * b;
      }

      return { x, y, h, rz, ry, rx: 0, z, op, sx: 1, sy: 1, shadow: 1 };
    };

    const placeBar = (bar: any, state: BarState, vw: number, vh: number) => {
      if (!bar) return;
      if (state.op <= 0.01) {
        bar.group.visible = false;
        bar.shadowMesh.visible = false;
        return;
      }
      bar.group.visible = true;
      bar.shadowMesh.visible = state.shadow > 0.01;

      const s = state.h / BH;
      bar.group.position.set(state.x - vw / 2, vh / 2 - state.y, state.z);
      bar.group.scale.set(s * state.sx, s * state.sy, s);
      bar.group.rotation.order = 'ZYX';
      bar.group.rotation.set(
        (state.rx * Math.PI) / 180,
        (state.ry * Math.PI) / 180,
        (-state.rz * Math.PI) / 180
      );
      bar.frontMat.opacity = state.op;
      bar.backMat.opacity = state.op;

      bar.shadowMesh.position.set(
        state.x - vw / 2,
        vh / 2 - state.y - 0.05 * state.h,
        state.z - 0.32 * state.h
      );
      bar.shadowMesh.rotation.z = (-state.rz * Math.PI) / 180;
      const cosRy = Math.max(0.3, Math.abs(Math.cos((state.ry * Math.PI) / 180)));
      bar.shadowMesh.scale.set(s * cosRy * state.sx, s * state.sy, 1);
      bar.shadowMat.opacity = 0.5 * state.op * state.shadow;
    };

    const makeBarObject = (THREE: any, frontTex: any, backTex: any) => {
      const group = new THREE.Group();
      const frontMat = new THREE.MeshPhysicalMaterial({
        map: frontTex,
        transparent: true,
        alphaTest: 0.5,
        roughness: 0.45,
        metalness: 0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.32,
        envMapIntensity: 0.42,
      });
      const backMat = new THREE.MeshPhysicalMaterial({
        map: backTex,
        transparent: true,
        alphaTest: 0.5,
        roughness: 0.45,
        metalness: 0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.32,
        envMapIntensity: 0.42,
      });
      const frontMesh = new THREE.Mesh(frontGeo, frontMat);
      const backMesh = new THREE.Mesh(backGeo, backMat);
      group.add(frontMesh);
      group.add(backMesh);

      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.renderOrder = -1;

      scene.add(group);
      scene.add(shadowMesh);

      return {
        group,
        frontMesh,
        backMesh,
        frontMat,
        backMat,
        shadowMesh,
        shadowMat,
        j: 0,
        flavIdx: -1,
      };
    };

    const syncCameraAndRenderer = () => {
      if (!renderer || !camera) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.style.height = `${vh}px`;
      renderer.setPixelRatio(
        vw < 820 ? Math.min(window.devicePixelRatio, 1.75) : Math.min(window.devicePixelRatio, 2)
      );
      renderer.setSize(vw, vh, false);

      const D = clamp(1500 * Math.min(vw / 1440, vh / 900), 1000, 2200);
      const fov = 2 * Math.atan(vh / 2 / D) * (180 / Math.PI);
      camera.fov = fov;
      camera.aspect = vw / vh;
      camera.near = 10;
      camera.far = 4 * D;
      camera.position.set(0, 0, D);
      camera.updateProjectionMatrix();
    };

    // Smooth scroll (desktop wheel only)
    const isTouchDevice = () =>
      window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: hover)').matches;

    const onWheel = (e: WheelEvent) => {
      const st = animRef.current;
      if (
        st.reduced ||
        document.body.classList.contains('locked') ||
        e.ctrlKey ||
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ||
        isTouchDevice()
      ) {
        return;
      }
      // Do not intercept if inside open cart/dibs drawer
      if ((e.target as HTMLElement)?.closest?.('.drawer-panel')) return;

      e.preventDefault();
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (!st.smoothScrolling) {
        st.scrollCur = window.scrollY;
        st.scrollTarget = window.scrollY;
        st.smoothScrolling = true;
      }
      st.scrollTarget = clamp(st.scrollTarget + e.deltaY, 0, maxScroll);
    };

    const stopSmoothScroll = () => {
      const st = animRef.current;
      st.smoothScrolling = false;
      st.scrollCur = window.scrollY;
      st.scrollTarget = window.scrollY;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', stopSmoothScroll, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
        stopSmoothScroll();
      }
    });

    // Drag & raycast interaction on .arc
    const arcEl = arcRef.current;
    let dragPointerId = -1;
    let downX = 0;
    let downY = 0;
    let startPos = 1;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let movedPastThreshold = false;

    const raycastHeroBar = (clientX: number, clientY: number): number | null => {
      if (!raycaster || !camera) return null;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ndc = new THREE_MOD.Vector2(
        (clientX / vw) * 2 - 1,
        -(clientY / vh) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const targets: any[] = [];
      const barMap = new Map<any, number>();

      if (travellerBar && travellerBar.group.visible) {
        targets.push(travellerBar.frontMesh, travellerBar.backMesh);
        const jT = Math.round(animRef.current.target);
        barMap.set(travellerBar.frontMesh, jT);
        barMap.set(travellerBar.backMesh, jT);
      }
      for (const b of poolBars) {
        if (b.group.visible) {
          targets.push(b.frontMesh, b.backMesh);
          barMap.set(b.frontMesh, b.j);
          barMap.set(b.backMesh, b.j);
        }
      }
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        return barMap.get(hits[0].object) ?? null;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const st = animRef.current;
      if (!st.heroEntered) return;
      stopSmoothScroll();
      dragPointerId = e.pointerId;
      downX = e.clientX;
      downY = e.clientY;
      lastX = e.clientX;
      lastTime = performance.now();
      startPos = st.pos;
      velocity = 0;
      movedPastThreshold = false;
      st.lastInteract = performance.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      const st = animRef.current;
      if (dragPointerId === e.pointerId) {
        const dx = e.clientX - downX;
        const now = performance.now();
        st.lastInteract = now;
        if (!movedPastThreshold && Math.abs(dx) > 6) {
          movedPastThreshold = true;
          st.isDragging = true;
          st.slide = null;
          try {
            arcEl?.setPointerCapture(e.pointerId);
          } catch {}
          document.body.classList.add('dragging');
        }
        if (movedPastThreshold) {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const { u, xSpread } = getHeroMetrics(vw, vh);
          const slotPx = 245 * u * xSpread;
          st.pos = startPos - dx / slotPx;
          const dt = Math.max(now - lastTime, 4);
          const instV = -(e.clientX - lastX) / slotPx / dt;
          velocity = lerp(velocity, instV, 0.4);
          lastX = e.clientX;
          lastTime = now;
        }
      } else if (e.pointerType === 'mouse' && arcEl && st.heroEntered && !st.isDragging) {
        const hitJ = raycastHeroBar(e.clientX, e.clientY);
        arcEl.style.cursor = hitJ !== null ? 'pointer' : 'grab';
      }
    };

    const finishDrag = (e: PointerEvent, isCancel: boolean) => {
      if (dragPointerId !== e.pointerId) return;
      dragPointerId = -1;
      const st = animRef.current;
      if (movedPastThreshold) {
        st.isDragging = false;
        document.body.classList.remove('dragging');
        try {
          arcEl?.releasePointerCapture(e.pointerId);
        } catch {}

        if (isCancel && Math.abs(st.pos - Math.round(st.pos)) <= 0.02) {
          const to = Math.round(st.pos);
          goTo(to, 380);
        } else {
          const to = Math.round(st.pos + clamp(velocity * 220, -2, 2));
          const dur = Math.max(380, 650 * Math.min(1, Math.abs(to - st.pos) + 0.35));
          goTo(to, dur);
          // Immediately trigger flavour effects on release if centre flavour changed
          const newFlav = ((to % 5) + 5) % 5;
          if (newFlav !== st.activeFlav) {
            triggerFlavourEffects(newFlav, to >= st.target ? 1 : -1);
            if (st.slide) st.slide.triggered12 = true;
          }
        }
      } else if (!isCancel) {
        // Tap / click
        const hitJ = raycastHeroBar(e.clientX, e.clientY);
        if (hitJ !== null) {
          const k = hitJ - st.target;
          if (k !== 0) {
            goTo(st.target + k);
          }
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => finishDrag(e, false);
    const onPointerCancel = (e: PointerEvent) => finishDrag(e, true);

    if (arcEl) {
      arcEl.addEventListener('pointerdown', onPointerDown);
      arcEl.addEventListener('pointermove', onPointerMove);
      arcEl.addEventListener('pointerup', onPointerUp);
      arcEl.addEventListener('pointercancel', onPointerCancel);
    }

    // Boot Three.js via importmap
    (async () => {
      try {
        const threeModId = 'three';
        const roomModId = 'three/addons/environments/RoomEnvironment.js';
        const [THREE, { RoomEnvironment }] = await Promise.all([
          import(/* @vite-ignore */ threeModId),
          import(/* @vite-ignore */ roomModId),
        ]);
        if (disposed) return;

        THREE_MOD = THREE;
        raycaster = new THREE.Raycaster();

        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;

        scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = envRT.texture;
        pmrem.dispose();

        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
        keyLight.position.set(-0.6, 0.9, 1.4);
        scene.add(keyLight);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 8000);
        syncCameraAndRenderer();

        const geos = buildBarGeometries(THREE);
        frontGeo = geos.frontGeo;
        backGeo = geos.backGeo;
        shadowGeo = geos.shadowGeo;
        shadowTex = geos.shadowTex;

        // Placeholder textures until image & fonts load
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 4;
        dummyCanvas.height = 4;
        const dummyTex = new THREE.CanvasTexture(dummyCanvas);

        for (let i = 0; i < 11; i++) {
          poolBars.push(makeBarObject(THREE, dummyTex, dummyTex));
        }
        travellerBar = makeBarObject(THREE, dummyTex, dummyTex);

        document.documentElement.classList.add('gl');

        // Load sprite sheet image + fonts for 3D bar textures
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const imgLoaded = new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = SHEET_URL;
        });

        const fontsLoaded = Promise.all([
          document.fonts.load('400 48px "Archivo Black"'),
          document.fonts.load('400 14px "DM Mono"'),
          document.fonts.load('500 14px "DM Mono"'),
          document.fonts.load('700 16px "Inter"'),
        ]).catch(() => {});

        await Promise.all([imgLoaded, fontsLoaded]);
        if (disposed || img.naturalWidth === 0) {
          // Still render loop
        } else {
          FLAVORS.forEach((flav, idx) => {
            flavorTextures[idx] = buildBarTextures(THREE, img, flav, idx);
          });
          // Apply to traveller & pool
          for (const b of poolBars) b.flavIdx = -1;
          travellerBar.flavIdx = -1;
        }

        let prevNow = performance.now();

        const tick = (now: number) => {
          if (disposed) return;
          const dt = Math.min(now - prevNow, 64);
          prevNow = now;

          const st = animRef.current;
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          // 1. Smooth scroll
          if (st.smoothScrolling && !st.reduced) {
            st.scrollCur += (st.scrollTarget - st.scrollCur) * (1 - Math.exp(-dt / 120));
            window.scrollTo(0, st.scrollCur);
            if (Math.abs(st.scrollTarget - st.scrollCur) < 0.5) {
              window.scrollTo(0, st.scrollTarget);
              st.scrollCur = st.scrollTarget;
              st.smoothScrolling = false;
            }
          }

          // 2. Pos slide tween
          if (st.slide) {
            const elapsed = now - st.slide.start;
            const rawT = clamp(elapsed / st.slide.dur, 0, 1);
            const curve = st.slide.isEntrance ? ENTRANCE_CURVE : GLIDE_CURVE;
            st.pos = lerp(st.slide.from, st.slide.to, curve(rawT));

            if (!st.slide.triggered12 && rawT >= 0.12) {
              st.slide.triggered12 = true;
              triggerFlavourEffects(st.slide.newFlav, st.slide.dir);
            }
            if (rawT >= 1) {
              st.pos = st.slide.to;
              st.slide = null;
            }
          }

          // 3. Feathered color reveal
          if (st.reveal && revealRef.current) {
            const rawT = clamp((now - st.reveal.start) / st.reveal.dur, 0, 1);
            const r = st.reveal.R * GLIDE_CURVE(rawT);
            const f = Math.max(60, 0.35 * r);
            const maskStr = `radial-gradient(circle at ${st.reveal.cx}px ${st.reveal.cy}px, #000 ${Math.max(0, r - f)}px, transparent ${r}px)`;
            revealRef.current.style.maskImage = maskStr;
            revealRef.current.style.webkitMaskImage = maskStr;
            if (rawT >= 1) {
              document.documentElement.style.setProperty('--flav', st.reveal.color);
              revealRef.current.style.setProperty('--rv', 'transparent');
              revealRef.current.style.maskImage = '';
              revealRef.current.style.webkitMaskImage = '';
              st.reveal = null;
            }
          }

          // 4. Section 2 scroll, sticky front layer, flip tween & storm
          const insideEl = insideRef.current;
          const shopEl = shopRef.current;
          const rangeEl = rangeRef.current;
          let p1 = 0;
          let p3 = 0;
          let q = 0;

          if (insideEl) {
            const inRect = insideEl.getBoundingClientRect();
            p1 = clamp(1 - inRect.top / vh, 0, 1);

            // Sticky-emulating fixed front layer
            const inFront = inFrontRef.current;
            if (inFront) {
              const intersects = inRect.bottom > 0 && inRect.top < vh;
              if (intersects) {
                inFront.classList.add('show');
                const pinY =
                  inRect.top > 0
                    ? inRect.top
                    : inRect.bottom < vh
                    ? inRect.bottom - vh
                    : 0;
                inFront.style.transform = `translate3d(0, ${pinY}px, 0)`;
              } else {
                inFront.classList.remove('show');
              }
            }

            // Scaled frames (1440x900 desktop, 390x780 phone)
            const kScale =
              vw < 820
                ? Math.min(vw / 390, vh / 780)
                : Math.min(vw / 1440, vh / 900);
            const frameT = `translate(-50%, -50%) scale(${kScale})`;
            if (inBackFrameRef.current) inBackFrameRef.current.style.transform = frameT;
            if (inFrontFrameRef.current) inFrontFrameRef.current.style.transform = frameT;

            // Scroll mapping
            const p = clamp(-inRect.top / Math.max(1, inRect.height - vh), 0, 1);
            const step = Math.floor(Math.min(p, 0.759) / 0.19);
            q = clamp((p - 0.76) / 0.24, 0, 1);

            // Trigger step flip tween
            if (step !== st.curStep) {
              st.curStep = step;
              setStepIdx(step);
              const targetAngle = STEPS[step].ry;
              if (st.reduced) {
                st.flipRy = targetAngle;
                st.flipTween = null;
                setDisplayStep(step);
                setStepFlavName(FLAVORS[st.activeFlav].name);
              } else {
                const halfTurns = clamp(Math.abs(targetAngle - st.flipRy) / 180, 0.4, 2);
                const dur = 720 * halfTurns;
                st.flipTween = {
                  from: st.flipRy,
                  to: targetAngle,
                  start: now,
                  dur,
                  targetStep: step,
                  textSwapped: false,
                };
              }
            }

            // Advance flip tween
            if (st.flipTween) {
              const elapsed = now - st.flipTween.start;
              const rawT = clamp(elapsed / st.flipTween.dur, 0, 1);
              st.flipRy = lerp(st.flipTween.from, st.flipTween.to, easeInOutSine(rawT));

              const textTrigger = 0.38 * Math.min(st.flipTween.dur, 720);
              if (!st.flipTween.textSwapped && elapsed >= textTrigger) {
                st.flipTween.textSwapped = true;
                const ts = st.flipTween.targetStep;
                setInTextFading('out');
                window.setTimeout(() => {
                  setDisplayStep(ts);
                  setStepFlavName(FLAVORS[animRef.current.activeFlav].name);
                  setInTextFading('in');
                  window.setTimeout(() => setInTextFading('idle'), 460);
                }, 40);
              }

              if (rawT >= 1) {
                st.flipRy = st.flipTween.to;
                st.flipTween = null;
              }
            }

            // Storm overlay & pieces
            const frontFade = 1 - clamp(4 * q, 0, 1);
            if (inFrontFrameRef.current) inFrontFrameRef.current.style.opacity = `${frontFade}`;
            if (inNumRef.current) inNumRef.current.style.opacity = `${frontFade}`;
            if (inDarkRef.current) {
              inDarkRef.current.style.opacity = `${clamp(3.5 * q, 0, 1) * 0.42}`;
            }

            const R = 0.55 * Math.hypot(vw, vh);
            const baseSize = 0.085 * Math.min(vw, vh);
            STORM_SEEDS.forEach((seed, si) => {
              const el = stormPieceRefs.current[si];
              if (!el) return;
              if (q <= 0 || q >= 1 || st.reduced) {
                el.style.opacity = '0';
                return;
              }
              const s = clamp((q - 0.45 * seed.phase) / 0.55, 0, 1);
              if (s <= 0 || s >= 1) {
                el.style.opacity = '0';
                return;
              }
              const radius = (0.06 + Math.pow(s, 1.5) * 0.95) * R;
              const px = vw / 2 + Math.cos(seed.angle) * radius;
              const py = vh / 2 + Math.sin(seed.angle) * radius * 0.8;
              const sc = (0.2 + 1.7 * s) * seed.sizeFactor;
              const rot = seed.spin * s;
              const op =
                Math.sin(Math.PI * s) * clamp(5 * q, 0, 1) * clamp(6 * (1 - q), 0, 1);

              const targetBit = seed.bitIdx === -1 ? FLAVORS[st.activeFlav].bit : seed.bitIdx;
              const bitBox = BITS[targetBit];
              const style = sprStyle(bitBox, 0);
              el.style.width = `${baseSize}px`;
              el.style.height = `${baseSize * (bitBox[3] / bitBox[2])}px`;
              el.style.backgroundSize = style.backgroundSize as string;
              el.style.backgroundPosition = style.backgroundPosition as string;
              el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`;
              el.style.opacity = `${op}`;
            });
          }

          if (shopEl) {
            const shopRect = shopEl.getBoundingClientRect();
            p3 = clamp((vh - shopRect.top) / (0.7 * vh), 0, 1);

            if (vw < 820 && p3 > 0 && !st.phoneScrolledToCard) {
              st.phoneScrolledToCard = true;
              const liveCard = cardRefs.current[st.activeFlav];
              if (liveCard && cardsRef.current) {
                liveCard.scrollIntoView({ behavior: st.reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
              }
            } else if (p3 <= 0) {
              st.phoneScrolledToCard = false;
            }
          }

          // 5. Nav active section & theme
          const sections: [string, HTMLElement | null][] = [
            ['flavors', heroRef.current],
            ['inside', insideRef.current],
            ['shop', shopRef.current],
            ['range', rangeRef.current],
          ];
          let currentSection = 'flavors';
          for (const [id, el] of sections) {
            if (el && el.getBoundingClientRect().top <= vh * 0.35) {
              currentSection = id;
            }
          }
          setActiveNav((prev) => (prev === currentSection ? prev : currentSection));
          if (currentSection === 'range') {
            setNavTheme((prev) => (prev === 'dark' ? prev : 'dark'));
          } else if (currentSection === 'shop') {
            setNavTheme((prev) => (prev === 'light' ? prev : 'light'));
          } else {
            setNavTheme((prev) => (prev === 'default' ? prev : 'default'));
          }

          // 6. Place hero pool bars (11 bars, skipping selected traveller jT)
          const jT = Math.round(st.target);
          const baseJ = Math.floor(st.pos) - 5;
          const poolFade = 1 - clamp(1.6 * p1, 0, 1);

          for (let i = 0; i < poolBars.length; i++) {
            const bar = poolBars[i];
            const j = baseJ + i;
            bar.j = j;
            if (j === jT || poolFade <= 0.01) {
              bar.group.visible = false;
              bar.shadowMesh.visible = false;
              continue;
            }
            const flavIdx = ((j % 5) + 5) % 5;
            if (flavorTextures[flavIdx] && bar.flavIdx !== flavIdx) {
              bar.flavIdx = flavIdx;
              bar.frontMat.map = flavorTextures[flavIdx].frontTex;
              bar.backMat.map = flavorTextures[flavIdx].backTex;
              bar.frontMat.needsUpdate = true;
              bar.backMat.needsUpdate = true;
            }
            const barState = getArcState(j - st.pos, j, now, vw, vh, st.reduced);
            barState.op *= poolFade;
            placeBar(bar, barState, vw, vh);
          }

          // 7. Place the single Traveller bar (A -> B -> C)
          if (travellerBar) {
            const tFlav = ((jT % 5) + 5) % 5;
            if (flavorTextures[tFlav] && travellerBar.flavIdx !== tFlav) {
              travellerBar.flavIdx = tFlav;
              travellerBar.frontMat.map = flavorTextures[tFlav].frontTex;
              travellerBar.backMat.map = flavorTextures[tFlav].backTex;
              travellerBar.frontMat.needsUpdate = true;
              travellerBar.backMat.needsUpdate = true;
            }

            // Anchor A: Hero
            const stateA = getArcState(jT - st.pos, jT, now, vw, vh, st.reduced);
            let travState = stateA;

            // Anchor B: Section 2
            if (p1 > 0 && inBarRef.current) {
              const bRect = inBarRef.current.getBoundingClientRect();
              const bob = st.reduced ? 0 : Math.sin((now / 2600) * Math.PI * 2) * 6;
              const stormSpin = st.reduced ? 0 : 720 * q;
              const stateB: BarState = {
                x: bRect.left + bRect.width / 2,
                y: bRect.top + bRect.height / 2 + bob,
                h: bRect.height,
                rz: 14,
                ry: st.flipRy + stormSpin,
                rx: 0,
                z: 0,
                op: 1,
                sx: 1,
                sy: 1,
                shadow: 1,
              };
              travState = lerpBarState(travState, stateB, easeInOutSine(p1));

              // Anchor C: Live shop card
              if (p3 > 0) {
                const livePk = pkRefs.current[tFlav];
                if (livePk) {
                  const cRect = livePk.getBoundingClientRect();
                  const tilt = st.tilts[tFlav] || { x: 0, y: 0 };
                  const wholeTurn = Math.round(stateB.ry / 360) * 360;
                  let sx = 1;
                  let sy = 1;
                  if (st.poke && st.poke.cardIdx === tFlav) {
                    const pt = clamp((now - st.poke.start) / st.poke.dur, 0, 1);
                    if (pt >= 1) {
                      st.poke = null;
                    } else if (pt < 0.3) {
                      const k = pt / 0.3;
                      sx = lerp(1, 1.06, k);
                      sy = lerp(1, 0.93, k);
                    } else if (pt < 0.6) {
                      const k = (pt - 0.3) / 0.3;
                      sx = lerp(1.06, 0.97, k);
                      sy = lerp(0.93, 1.04, k);
                    } else {
                      const k = (pt - 0.6) / 0.4;
                      sx = lerp(0.97, 1, k);
                      sy = lerp(1.04, 1, k);
                    }
                  }
                  const stateC: BarState = {
                    x: cRect.left + cRect.width / 2,
                    y: cRect.top + cRect.height / 2,
                    h: cRect.height,
                    rz: 0,
                    ry: wholeTurn + tilt.x * 14,
                    rx: -tilt.y * 14,
                    z: 30,
                    op: 1,
                    sx,
                    sy,
                    shadow: 0.7,
                  };
                  travState = lerpBarState(travState, stateC, easeInOutSine(p3));
                }
              }
            }

            placeBar(travellerBar, travState, vw, vh);
          }

          renderer.render(scene, camera);
          rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
      } catch (err) {
        console.error('Three.js initialization error:', err);
      }
    })();

    const onResize = () => syncCameraAndRenderer();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', stopSmoothScroll);
      if (arcEl) {
        arcEl.removeEventListener('pointerdown', onPointerDown);
        arcEl.removeEventListener('pointermove', onPointerMove);
        arcEl.removeEventListener('pointerup', onPointerUp);
        arcEl.removeEventListener('pointercancel', onPointerCancel);
      }
      frontGeo?.dispose();
      backGeo?.dispose();
      shadowGeo?.dispose();
      shadowTex?.dispose();
      envRT?.dispose();
      flavorTextures.forEach((t) => {
        t?.frontTex?.dispose();
        t?.backTex?.dispose();
      });
      renderer?.dispose();
    };
  }, [goTo, triggerFlavourEffects]);

  // Smooth scroll to anchor
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const targetY = el.getBoundingClientRect().top + window.scrollY;
    animRef.current.smoothScrolling = false;
    window.scrollTo({
      top: targetY,
      behavior: animRef.current.reduced ? 'auto' : 'smooth',
    });
  };

  // Smooth scroll to Section 2 step middle
  const scrollToStep = (i: number) => {
    const insideEl = insideRef.current;
    if (!insideEl) return;
    const rect = insideEl.getBoundingClientRect();
    const topInDoc = rect.top + window.scrollY;
    const targetP = (i + 0.5) * 0.19;
    const targetY = topInDoc + targetP * (rect.height - window.innerHeight);
    animRef.current.smoothScrolling = false;
    window.scrollTo({
      top: targetY,
      behavior: animRef.current.reduced ? 'auto' : 'smooth',
    });
  };

  // Fly to cart helper
  const flyToCart = (
    sources: { el: HTMLElement; box: [number, number, number, number] }[],
    onAllLanded: () => void
  ) => {
    if (animRef.current.reduced || sources.length === 0) {
      onAllLanded();
      return;
    }

    const bagEl = navBagRef.current;
    if (!bagEl) {
      onAllLanded();
      return;
    }
    const bagRect = bagEl.getBoundingClientRect();
    const bx = bagRect.left + bagRect.width / 2;
    const by = bagRect.top + bagRect.height / 2;

    let landedCount = 0;
    sources.forEach((src, i) => {
      const r = src.el.getBoundingClientRect();
      const sx = r.left + r.width / 2;
      const sy = r.top + r.height / 2;
      const dx = bx - sx;
      const dy = by - sy;
      const k = Math.min(0.2, 30 / Math.max(1, r.height));
      const lift = Math.min(160, 0.35 * Math.abs(dy) + 60);

      const clone = document.createElement('div');
      clone.className = 'spr';
      const spr = sprStyle(src.box, 4);
      clone.style.position = 'fixed';
      clone.style.left = `${r.left}px`;
      clone.style.top = `${r.top}px`;
      clone.style.width = `${r.width}px`;
      clone.style.height = `${r.height}px`;
      clone.style.backgroundSize = spr.backgroundSize as string;
      clone.style.backgroundPosition = spr.backgroundPosition as string;
      clone.style.zIndex = '70';
      clone.style.pointerEvents = 'none';
      clone.style.filter = 'drop-shadow(0 10px 14px rgba(0, 0, 0, 0.25))';
      document.body.appendChild(clone);

      const anim = clone.animate(
        [
          {
            transform: 'translate3d(0px, 0px, 0) scale(1) rotate(0deg)',
            opacity: 1,
          },
          {
            offset: 0.45,
            transform: `translate3d(${0.4 * dx}px, ${0.4 * dy - lift}px, 0) scale(${0.45 + k}) rotate(-10deg)`,
            opacity: 1,
          },
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${k}) rotate(-18deg)`,
            opacity: 0.15,
          },
        ],
        {
          duration: 900,
          delay: i * 120,
          easing: 'cubic-bezier(.5,0,.2,1)',
          fill: 'forwards',
        }
      );

      anim.onfinish = () => {
        clone.remove();
        setBagBumpKey((b) => b + 1);
        landedCount++;
        if (landedCount === sources.length) {
          onAllLanded();
        }
      };
    });
  };

  const addBagToCart = (flavIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const flav = FLAVORS[flavIdx];
    const pkEl = pkRefs.current[flavIdx];
    const commit = () => {
      setCart((prev) => {
        const id = `bag-${flavIdx}`;
        const existing = prev.find((item) => item.id === id);
        if (existing) {
          return prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it));
        }
        return [
          ...prev,
          { id, label: `${flav.name} (Single Bar)`, price: 2.99, qty: 1, color: flav.color, flavIdx },
        ];
      });
      setBadgePopKey((k) => k + 1);
    };

    if (pkEl) {
      flyToCart([{ el: pkEl, box: flav.box }], commit);
    } else {
      commit();
    }
  };

  // Shop card handlers
  const handleCardPointerMove = (idx: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const card = cardRefs.current[idx];
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5);
    const y = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5);
    animRef.current.tilts[idx] = { x, y };
    card.classList.add('tilting');
    card.style.transform = `translateY(-8px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg)`;
  };

  const handleCardPointerLeave = (idx: number) => {
    const card = cardRefs.current[idx];
    animRef.current.tilts[idx] = { x: 0, y: 0 };
    if (!card) return;
    card.classList.remove('tilting', 'pressed');
    card.style.transform = '';
  };

  const handleCardPointerDown = (idx: number) => {
    const card = cardRefs.current[idx];
    if (card) card.classList.add('pressed');
  };

  const handleCardPointerUp = (idx: number) => {
    const card = cardRefs.current[idx];
    if (card) card.classList.remove('pressed');
  };

  const handlePkClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx === activeFlavour) {
      animRef.current.poke = { start: performance.now(), dur: 500, cardIdx: idx };
    } else {
      const pkEl = pkRefs.current[idx];
      if (!pkEl || animRef.current.reduced) return;
      pkEl.animate(
        [
          { transform: 'translateX(-50%) translateZ(30px) scale(1, 1)' },
          { offset: 0.3, transform: 'translateX(-50%) translateZ(30px) scale(1.06, 0.93)' },
          { offset: 0.6, transform: 'translateX(-50%) translateZ(30px) scale(0.97, 1.04)' },
          { transform: 'translateX(-50%) translateZ(30px) scale(1, 1)' },
        ],
        { duration: 500, easing: 'ease-out' }
      );
    }
  };

  // Builder handlers
  const handleThumbClick = (flavIdx: number) => {
    animRef.current.packTouched = true;
    const emptyIdx = packSlots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;
    setPackSlots((prev) => {
      const next = [...prev];
      next[emptyIdx] = flavIdx;
      return next;
    });
    setGlowColor(hexWithAlpha(FLAVORS[flavIdx].color, 0.72));
    setGlowPulseKey((k) => k + 1);
  };

  const handleSlotRemove = (slotIdx: number) => {
    animRef.current.packTouched = true;
    setPackSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  const filledCount = packSlots.filter((s) => s !== null).length;
  const remaining = 3 - filledCount;

  const handleBuyPack = () => {
    if (remaining > 0 || buyAdded) return;
    animRef.current.packTouched = true;
    const picked = packSlots.filter((s): s is number => s !== null);
    const sources: { el: HTMLElement; box: [number, number, number, number] }[] = [];
    packSlots.forEach((fIdx, sIdx) => {
      const el = slotSprRefs.current[sIdx];
      if (fIdx !== null && el) {
        sources.push({ el, box: FLAVORS[fIdx].box });
      }
    });

    const summary = picked.map((idx) => FLAVORS[idx].name).join(' · ');
    flyToCart(sources, () => {
      setCart((prev) => [
        ...prev,
        {
          id: `pack-${Date.now()}`,
          label: `Custom 3 Pack (${summary})`,
          price: 7.48,
          qty: 1,
          color: FLAVORS[picked[0]].color,
          flavIdx: picked[0],
        },
      ]);
      setBadgePopKey((k) => k + 1);
    });

    window.setTimeout(() => {
      setPackSlots([null, null, null]);
      setBuyAdded(true);
      window.setTimeout(() => {
        setBuyAdded(false);
      }, 1600);
    }, 60);
  };

  const totalCartItems = cart.reduce((acc, it) => acc + it.qty, 0);
  const totalCartPrice = cart.reduce((acc, it) => acc + it.price * it.qty, 0);

  // Split title words & letters
  const titleWords = titleState.name.toUpperCase().split(' ');
  let globalCharIdx = 0;

  // Step 04 headline formatting
  const stepData = STEPS[displayStep];
  const stepHeadText = displayStep === 3 ? stepFlavName.toUpperCase().replace(/ /g, '\n') : stepData.head;
  const hasLongWord = stepHeadText.split(/\s+/).some((w) => w.length > 9);

  return (
    <>
      {/* INTRO */}
      {introPhase !== 'done' && (
        <div
          id="intro"
          ref={introRef}
          className={introPhase === 'logo' ? 'cream' : ''}
        >
          {introPhase === 'video' && (
            <>
              <video
                ref={videoRef}
                src={VIDEO_URL}
                muted
                playsInline
                preload="auto"
              />
              <button
                id="skip"
                type="button"
                onClick={() => enterHero()}
              >
                Skip intro
              </button>
            </>
          )}
          {introPhase === 'logo' && (
            <div className="stamp pop">
              <svg className="stamp-mark" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="50" fill="#1c1a1f" />
                <path
                  d="M22 68 L42 36 L55 54 L64 42 L78 68 Z"
                  fill="#f0e8e0"
                />
              </svg>
              <span className="stamp-word">STRIDE</span>
            </div>
          )}
        </div>
      )}

      {/* NAV */}
      <nav
        className={`nav ${heroEntered ? 'in' : ''} ${navTheme === 'light' ? 'light' : ''} ${
          navTheme === 'dark' ? 'dark' : ''
        }`}
        aria-label="Primary navigation"
      >
        <a
          href="#flavors"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('flavors');
          }}
        >
          <svg className="brand-mark" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="disc" cx="50" cy="50" r="50" />
            <path className="peak" d="M22 68 L42 36 L55 54 L64 42 L78 68 Z" />
          </svg>
          <span className="brand-word">STRIDE</span>
        </a>

        <div className="nav-pill" ref={navPillRef}>
          <div className="nav-hi" ref={navHiRef} aria-hidden="true" />
          {NAV_ITEMS.map((item, i) => (
            <a
              key={item.id}
              ref={(el) => {
                navLinkRefs.current[i] = el;
              }}
              href={`#${item.id}`}
              className={`nav-link ${activeNav === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-chip nav-chip-off"
            onClick={() => scrollToSection('range')}
          >
            % OFF
          </button>

          <button
            ref={navBagRef}
            key={bagBumpKey}
            type="button"
            className={`nav-chip nav-bag ${bagBumpKey > 0 ? 'bump' : ''}`}
            aria-label={`Shopping bag, ${totalCartItems} items`}
            onClick={() => setCartOpen(true)}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            <span
              key={badgePopKey}
              className={`bag-badge ${totalCartItems > 0 ? 'show' : ''} ${
                badgePopKey > 0 && totalCartItems > 0 ? 'pop' : ''
              }`}
            >
              {totalCartItems}
            </span>
          </button>

          <button
            type="button"
            className="nav-cta"
            onClick={() => {
              setDibsSent(false);
              setDibsOpen(true);
            }}
          >
            First dibs
          </button>
        </div>
      </nav>

      {/* SECTION 1: HERO CAROUSEL */}
      <section id="flavors" ref={heroRef}>
        <div className="reveal" ref={revealRef} aria-hidden="true" />
        <div className={`rings ${heroEntered ? 'in' : ''}`} aria-hidden="true" />

        <div className="bits" aria-hidden="true">
          {HERO_BITS.map((b, i) => {
            const box = BITS[b.bit];
            const ratio = box[3] / box[2];
            return (
              <div
                key={i}
                ref={(el) => {
                  bitRefs.current[i] = el;
                }}
                className={`bit spr ${b.hidePhone ? 'bit-hide-phone' : ''}`}
                style={{
                  ...sprStyle(box, 0),
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `calc(${b.size} * var(--u))`,
                  height: `calc(${b.size * ratio} * var(--u))`,
                  ['--r' as string]: `${b.rot}deg`,
                }}
              />
            );
          })}
        </div>

        <div className="arc" ref={arcRef} aria-hidden="true" />

        <button
          id="play"
          type="button"
          className={heroEntered ? 'in' : ''}
          style={{ transitionDelay: heroEntered ? '500ms' : '0ms' }}
          aria-label="Next flavour"
          onClick={() => goTo(animRef.current.target + 1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>

        <h1
          id="title"
          ref={titleRef}
          className="disp"
          aria-live="polite"
          style={titleFontSize ? { fontSize: titleFontSize } : undefined}
        >
          {exitingTitle && (
            <span
              className="title-layer exiting"
              ref={exitingTitleRef}
              key={`exit-${exitingTitle.key}`}
              aria-hidden="true"
            >
              {exitingTitle.name
                .toUpperCase()
                .split(' ')
                .map((word, wi) => (
                  <span className="word" key={`ew-${exitingTitle.key}-${wi}`}>
                    {word.split('').map((ch, ci) => (
                      <span className="char" key={`ec-${exitingTitle.key}-${wi}-${ci}`}>
                        {ch}
                      </span>
                    ))}
                  </span>
                ))}
            </span>
          )}
          <span className="title-layer entering" key={`enter-${titleState.key}`}>
            {titleWords.map((word, wi) => (
              <span className="word" key={`${titleState.key}-${wi}`}>
                {word.split('').map((ch, ci) => {
                  const idx = globalCharIdx++;
                  return (
                    <span
                      className="char"
                      key={`${titleState.key}-${wi}-${ci}-${idx}`}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            ))}
          </span>
        </h1>

        <div
          id="count"
          ref={countRef}
          className={`disp ${heroEntered ? 'in' : ''}`}
          style={{ transitionDelay: heroEntered ? '620ms' : '0ms' }}
          aria-hidden="true"
        >
          {counterDisplay}
        </div>

        <button
          id="auto"
          type="button"
          className={heroEntered ? 'in' : ''}
          style={{ transitionDelay: heroEntered ? '740ms' : '0ms' }}
          aria-pressed={autoplay}
          onClick={() => {
            animRef.current.lastInteract = performance.now();
            setAutoplay((a) => !a);
          }}
        >
          <span className="auto-ring" aria-hidden="true">
            {autoplay ? (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                <rect x="2" y="2" width="2.8" height="8" rx="1" />
                <rect x="7.2" y="2" width="2.8" height="8" rx="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 2.2l7 3.8-7 3.8V2.2z" />
              </svg>
            )}
          </span>
          <span className="auto-lbl">Autoplay</span>
        </button>
      </section>

      {/* SECTION 2: INSIDE */}
      <section id="inside" ref={insideRef}>
        <div className="pin">
          <div className="in-dark" ref={inDarkRef} aria-hidden="true" />
          <div className="in-frame" ref={inBackFrameRef}>
            <div
              className="in-num disp"
              ref={inNumRef}
              style={{
                transition: 'opacity 240ms ease, transform 460ms cubic-bezier(.22,1,.36,1)',
                transform:
                  inTextFading === 'out'
                    ? 'translateY(-10px)'
                    : inTextFading === 'in'
                    ? 'translateY(14px)'
                    : 'translateY(0)',
                opacity: inTextFading === 'out' ? 0 : undefined,
              }}
              aria-hidden="true"
            >
              {stepData.num}
            </div>
            <div id="inBar" ref={inBarRef} aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* SECTION 2 FRONT LAYER (z-index 3, above #gl canvas) */}
      <div id="inFront" ref={inFrontRef}>
        <div className="in-frame" ref={inFrontFrameRef}>
          <h2
            className={`in-head disp ${hasLongWord ? 'long' : ''}`}
            style={{
              transition: 'opacity 240ms ease, transform 460ms cubic-bezier(.22,1,.36,1)',
              transform:
                inTextFading === 'out'
                  ? 'translateY(-10px)'
                  : inTextFading === 'in'
                  ? 'translateY(14px)'
                  : 'translateY(0)',
              opacity: inTextFading === 'out' ? 0 : 1,
            }}
          >
            {stepHeadText}
          </h2>

          <div className="in-icons" role="tablist" aria-label="Bar story steps">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={stepIdx === i}
                aria-label={`Step 0${i + 1}`}
                className={`in-icon ${stepIdx === i ? 'active' : ''}`}
                onClick={() => scrollToStep(i)}
              >
                {i === 0 && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                )}
                {i === 1 && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <ellipse cx="8" cy="8" rx="2.6" ry="4" transform="rotate(-35 8 8)" />
                    <ellipse cx="16" cy="8" rx="2.6" ry="4" transform="rotate(35 16 8)" />
                    <ellipse cx="8" cy="16" rx="2.6" ry="4" transform="rotate(35 8 16)" />
                    <ellipse cx="16" cy="16" rx="2.6" ry="4" transform="rotate(-35 16 16)" />
                  </svg>
                )}
                {i === 2 && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                )}
                {i === 3 && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <p
            className="in-cap"
            style={{
              transition: 'opacity 240ms ease, transform 460ms cubic-bezier(.22,1,.36,1)',
              transform:
                inTextFading === 'out'
                  ? 'translateY(-10px)'
                  : inTextFading === 'in'
                  ? 'translateY(14px)'
                  : 'translateY(0)',
              opacity: inTextFading === 'out' ? 0 : 1,
            }}
          >
            {stepData.cap}
          </p>
        </div>

        <div className="storm" aria-hidden="true">
          {STORM_SEEDS.map((_, si) => (
            <div
              key={si}
              ref={(el) => {
                stormPieceRefs.current[si] = el;
              }}
              className="storm-piece spr"
            />
          ))}
        </div>
      </div>

      {/* SECTION 3: SHOP */}
      <section id="shop" ref={shopRef} className={shopRevealed ? 'revealed' : ''}>
        <div className="shop-head-wrap">
          <h2 className="shop-head disp">
            <span className="reveal-line">
              <span>GRAB</span>
            </span>
            <span className="reveal-line delay">
              <span>A BAG</span>
            </span>
          </h2>
          <p className="shop-cap">
            {'Five bold flavours. Same\nreal ingredients. Pick your\nfavourite (or try them all).'}
          </p>
        </div>

        <div className="cards" ref={cardsRef}>
          {FLAVORS.map((flav, i) => (
            <div
              key={flav.name}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`card ${activeFlavour === i ? 'live' : ''}`}
              style={{
                background: flav.color,
                transitionDelay: shopRevealed ? `${i * 80}ms` : '0ms',
              }}
              onPointerMove={(e) => handleCardPointerMove(i, e)}
              onPointerLeave={() => handleCardPointerLeave(i)}
              onPointerDown={() => handleCardPointerDown(i)}
              onPointerUp={() => handleCardPointerUp(i)}
              onClick={(e) => handlePkClick(i, e)}
            >
              <h3 className="card-name disp">{flav.lines.join('\n')}</h3>
              <div
                ref={(el) => {
                  pkRefs.current[i] = el;
                }}
                className="pk spr"
                style={sprStyle(flav.box, 4)}
                onClick={(e) => handlePkClick(i, e)}
              />
              <button
                type="button"
                className="card-add"
                aria-label={`Add a bag of ${flav.name} to the cart`}
                onClick={(e) => addBagToCart(i, e)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: RANGE / BUILD YOUR 3 PACK */}
      <section
        id="range"
        ref={rangeRef}
        className={rangeRevealed ? 'revealed' : ''}
      >
        <div className="range-grid">
          <div className="range-left">
            <h2 className="range-head disp">
              <span className="reveal-line">
                <span>BUILD YOUR</span>
              </span>
              <span className="reveal-line delay">
                <span>
                  <span className="pack-num">3</span> PACK &amp;
                </span>
              </span>
              <span className="reveal-line delay2">
                <span>SAVE $1.49</span>
              </span>
            </h2>

            <div className="thumbs">
              {FLAVORS.map((flav, i) => {
                const countInPack = packSlots.filter((s) => s === i).length;
                return (
                  <button
                    key={flav.name}
                    type="button"
                    className="thumb"
                    aria-label={`Add ${flav.name} to 3 pack`}
                    onClick={() => handleThumbClick(i)}
                  >
                    <span
                      className="thumb-box"
                      style={{ background: flav.color }}
                    >
                      <span
                        className="thumb-spr spr"
                        style={sprStyle(flav.box, 4)}
                      />
                    </span>
                    <span className="thumb-name">{flav.name}</span>
                    <span className={`thumb-ring ${countInPack > 0 ? 'has' : ''}`}>
                      {countInPack === 1 ? '✓' : countInPack > 1 ? countInPack : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              id="buy"
              type="button"
              className={buyAdded ? 'added' : ''}
              disabled={remaining > 0 && !buyAdded}
              onClick={handleBuyPack}
            >
              {buyAdded ? (
                <span>Added to cart</span>
              ) : remaining > 0 ? (
                <>
                  <span>Pick {remaining} more</span>
                  <span className="buy-price">$7.48</span>
                </>
              ) : (
                <>
                  <span>Add to cart</span>
                  <span className="buy-price">$7.48</span>
                </>
              )}
            </button>
          </div>

          <div
            key={glowPulseKey}
            className={`glow ${glowPulseKey > 0 ? 'pulse' : ''}`}
            style={{ ['--g' as string]: glowColor }}
          >
            {[0, 1, 2].map((sIdx) => {
              const fIdx = packSlots[sIdx];
              const isFilled = fIdx !== null;
              return (
                <div
                  key={sIdx}
                  className={`slot slot-${sIdx} ${isFilled ? 'filled' : ''}`}
                >
                  <div
                    ref={(el) => {
                      slotSprRefs.current[sIdx] = el;
                    }}
                    className="slot-spr spr"
                    style={isFilled ? sprStyle(FLAVORS[fIdx].box, 4) : undefined}
                  />
                  <button
                    type="button"
                    className="slot-x"
                    aria-label={
                      isFilled
                        ? `Remove ${FLAVORS[fIdx].name} from slot ${sIdx + 1}`
                        : `Empty slot ${sIdx + 1}`
                    }
                    onClick={() => {
                      if (isFilled) handleSlotRemove(sIdx);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <div
            className="drawer-panel"
            role="dialog"
            aria-label="Your bag"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="disp" style={{ margin: 0, fontSize: 28 }}>
                YOUR BAG ({totalCartItems})
              </h2>
              <button
                type="button"
                aria-label="Close bag"
                onClick={() => setCartOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: '1.5px solid var(--ink)',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                Your bag is empty. Pick a flavour from the shop or build a 3 pack below.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingBottom: 14,
                      borderBottom: '1px solid rgba(28,26,31,0.12)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          className="spr"
                          style={{
                            width: 16,
                            height: 33,
                            ...sprStyle(FLAVORS[item.flavIdx].box, 4),
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{item.label}</div>
                        <div className="mono" style={{ fontSize: 12, opacity: 0.65 }}>
                          Qty {item.qty} · ${(item.price * item.qty).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCart((prev) => prev.filter((it) => it.id !== item.id))
                      }
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontFamily: 'DM Mono, monospace',
                        opacity: 0.6,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1.5px solid var(--ink)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span className="mono" style={{ fontSize: 13 }}>SUBTOTAL</span>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 500 }}>
                      ${totalCartPrice.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCart([]);
                      setCartOpen(false);
                    }}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 999,
                      border: 'none',
                      background: 'var(--ink)',
                      color: 'var(--cream)',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    Clear bag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FIRST DIBS DRAWER */}
      {dibsOpen && (
        <div className="drawer-backdrop" onClick={() => setDibsOpen(false)}>
          <div
            className="drawer-panel"
            role="dialog"
            aria-label="First dibs early access"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="disp" style={{ margin: 0, fontSize: 28 }}>
                FIRST DIBS
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDibsOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: '1.5px solid var(--ink)',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <p className="mono" style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              Pressed at dawn, small batch drops. Leave your email for early access to new flavours.
            </p>

            {dibsSent ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: '#8fa8a3',
                  color: '#191a1e',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                You are on the list for the next cold-pressed drop.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!dibsEmail.trim()) return;
                  setDibsSent(true);
                  setDibsEmail('');
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={dibsEmail}
                  onChange={(e) => setDibsEmail(e.target.value)}
                  style={{
                    height: 46,
                    padding: '0 14px',
                    borderRadius: 12,
                    border: '1.5px solid rgba(28,26,31,0.25)',
                    background: '#fff',
                    fontSize: 14,
                  }}
                />
                <button
                  type="submit"
                  style={{
                    height: 48,
                    borderRadius: 999,
                    border: 'none',
                    background: 'var(--ink)',
                    color: 'var(--cream)',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  Join the drop list
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
