import { useEffect, useRef } from 'react';

const PALETTE = [
  '#1a1a12', '#22221a', '#2a2a1e', '#323224', '#3a3a28', '#242420', '#181814',
  '#1e0a28', '#2a1038', '#361448', '#421058', '#2a0c40', '#4c1a68',
  '#5a1e80', '#662098',
  '#3a0828', '#4a0038', '#5a0048',
  '#3c0c08', '#4a100c', '#581410',
  '#081020', '#0c1428', '#101838',
  '#002020', '#002830',
  '#1a1a1a', '#222222', '#2a2a2a',
  '#484848', '#585858',
  '#0a0a0a', '#101010'
];

const UNIT = 28;

function randColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]!;
}

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alpha: number;
  alphaTarget: number;
  alphaSpeed: number;
};

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const blocksRef = useRef<Block[]>([]);
  const starsRef = useRef<{ x: number; y: number; r: number; a: number }[]>([]);
  const noiseRef = useRef<ImageData | null>(null);
  const netProgressRef = useRef(0);
  const netNodesRef = useRef<
    { x: number; y: number; label: string; labelColor: string; labelSide: string; ghost?: boolean }[]
  >([]);
  const netEdgesRef = useRef<[number, number][]>([]);
  const animTRef = useRef(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctxRaw = el.getContext('2d');
    if (!ctxRaw) return;
    const canvas = el;
    const ctx = ctxRaw;

    let logicalW = 300;
    let logicalH = 300;

    function initBlocks() {
      const W = logicalW;
      const H = logicalH;
      const cols = Math.ceil(W / UNIT) + 1;
      const rows = Math.ceil(H / UNIT) + 1;
      const occ = new Uint8Array(cols * rows);
      const idx = (c: number, r: number) => r * cols + c;
      const blocks: Block[] = [];

      for (let attempt = 0; attempt < 3000; attempt++) {
        const gc = Math.floor(Math.random() * cols);
        const gr = Math.floor(Math.random() * rows);
        const gwChoices = [1, 1, 2, 2, 3, 3, 4, 5, 6];
        const ghChoices = [1, 1, 2, 2, 3, 4];
        const gw = gwChoices[Math.floor(Math.random() * gwChoices.length)]!;
        const gh = ghChoices[Math.floor(Math.random() * ghChoices.length)]!;

        if (gc + gw > cols || gr + gh > rows) continue;

        let ok = true;
        outer: for (let dr = 0; dr < gh; dr++)
          for (let dc = 0; dc < gw; dc++)
            if (occ[idx(gc + dc, gr + dr)]!) {
              ok = false;
              break outer;
            }
        if (!ok) continue;

        for (let dr = 0; dr < gh; dr++) for (let dc = 0; dc < gw; dc++) occ[idx(gc + dc, gr + dr)] = 1;

        const px = gc * UNIT;
        const py = gr * UNIT;
        const pw = gw * UNIT - 3;
        const ph = gh * UNIT - 3;
        if (px + pw > W || py + ph > H || pw < 10 || ph < 10) continue;

        const baseAlpha = 0.55 + Math.random() * 0.45;
        blocks.push({
          x: px,
          y: py,
          w: pw,
          h: ph,
          color: randColor(),
          alpha: baseAlpha,
          alphaTarget: baseAlpha,
          alphaSpeed: 0.003 + Math.random() * 0.007
        });
      }
      blocksRef.current = blocks;
    }

    function initStars() {
      const W = logicalW;
      const H = logicalH;
      const count = Math.floor((W * H) / 600);
      const stars: { x: number; y: number; r: number; a: number }[] = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 0.8 + 0.2,
          a: Math.random() * 0.5 + 0.1
        });
      }
      starsRef.current = stars;
    }

    function buildNoise() {
      const W = canvas.width;
      const H = canvas.height;
      const img = ctx.createImageData(W, H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() < 0.5 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = Math.floor(Math.random() * 38 + 8);
      }
      noiseRef.current = img;
    }

    function initNetwork() {
      netProgressRef.current = 0;
      const W = logicalW;
      const H = logicalH;
      const mid = H * 0.5;
      const spread = H * 0.18;
      const rnd = (a: number, b: number) => (Math.random() * (b - a) + a).toFixed(4);

      const nodes: typeof netNodesRef.current = [
        { x: W * 0.04, y: mid, label: rnd(0.05, 0.35), labelColor: '#00d9a0', labelSide: 'left' },
        { x: W * 0.15, y: mid - spread * 0.6, label: rnd(0.1, 0.4), labelColor: '#4af0ff', labelSide: 'below' },
        { x: W * 0.15, y: mid + spread * 0.5, label: rnd(0.1, 0.4), labelColor: '#4af0ff', labelSide: 'above' },
        { x: W * 0.33, y: mid - spread * 0.4, label: rnd(0.1, 0.4), labelColor: '#e8eaf0', labelSide: 'above' },
        { x: W * 0.33, y: mid + spread * 0.3, label: rnd(0.1, 0.4), labelColor: '#e8eaf0', labelSide: 'below' },
        { x: W * 0.52, y: mid - spread * 0.2, label: rnd(0.15, 0.45), labelColor: '#e8eaf0', labelSide: 'above' },
        { x: W * 0.52, y: mid + spread * 0.15, label: rnd(0.15, 0.45), labelColor: '#e8eaf0', labelSide: 'below' },
        { x: W * 0.7, y: mid, label: rnd(0.2, 0.5), labelColor: '#ff4af8', labelSide: 'above' },
        { x: W * 0.88, y: mid - spread * 0.3, label: rnd(0.1, 0.3), labelColor: '#ff4af8', labelSide: 'right' }
      ];
      nodes.push(
        { x: W * 0.09, y: mid + spread * 0.9, label: rnd(0.05, 0.35), labelColor: '#6b8a7a', labelSide: 'below', ghost: true },
        { x: W * 0.24, y: mid + spread * 1.1, label: rnd(0.1, 0.4), labelColor: '#6b8a7a', labelSide: 'below', ghost: true },
        { x: W * 0.43, y: mid + spread * 1.0, label: rnd(0.1, 0.4), labelColor: '#e8eaf0', labelSide: 'below', ghost: true },
        { x: W * 0.62, y: mid + spread * 0.7, label: rnd(0.1, 0.4), labelColor: '#e8eaf0', labelSide: 'below', ghost: true }
      );
      netNodesRef.current = nodes;
      netEdgesRef.current = [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 4],
        [1, 4],
        [2, 3],
        [3, 5],
        [4, 6],
        [5, 7],
        [6, 7],
        [7, 8]
      ];
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      logicalW = Math.max(1, rect.width);
      logicalH = Math.max(1, rect.height);
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initBlocks();
      initStars();
      buildNoise();
      initNetwork();
    }

    function edgeLen(e: [number, number]) {
      const a = netNodesRef.current[e[0]]!;
      const b = netNodesRef.current[e[1]]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function drawNetwork() {
      const nodes = netNodesRef.current;
      const edges = netEdgesRef.current;
      if (!nodes.length) return;
      const totalLen = edges.reduce((s, e) => s + edgeLen(e), 0);
      const p = netProgressRef.current;
      const drawLen = totalLen * Math.min(p, 1);
      const dash: [number, number] = [3, 8];
      const dashSum = dash[0]! + dash[1]!;
      const offset = -((Date.now() * 0.022) % dashSum);

      let consumed = 0;
      for (const e of edges) {
        const a = nodes[e[0]]!;
        const b = nodes[e[1]]!;
        const len = edgeLen(e);
        const segDraw = Math.max(0, Math.min(len, drawLen - consumed));
        consumed += len;
        if (segDraw <= 0) continue;
        const t = segDraw / len;
        const ex = a.x + (b.x - a.x) * t;
        const ey = a.y + (b.y - a.y) * t;
        ctx.save();
        ctx.setLineDash(dash);
        ctx.lineDashOffset = offset;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
      }

      const revealed = new Set<number>();
      let c2 = 0;
      for (const e of edges) {
        const a = e[0]!;
        const b = e[1]!;
        if (c2 / totalLen <= p) revealed.add(a);
        c2 += edgeLen(e);
        if (c2 / totalLen <= p + 0.01) revealed.add(b);
      }

      ctx.font = '500 9px "JetBrains Mono", monospace';
      for (let i = 0; i < nodes.length; i++) {
        const pnode = nodes[i]!;
        if (!revealed.has(i)) continue;
        if (!pnode.ghost) {
          const sz = 5;
          ctx.save();
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1;
          ctx.fillRect(pnode.x - sz / 2, pnode.y - sz / 2, sz, sz);
          ctx.strokeRect(pnode.x - sz / 2, pnode.y - sz / 2, sz, sz);
          ctx.restore();
        }
        ctx.save();
        ctx.fillStyle = pnode.labelColor;
        const lx =
          pnode.labelSide === 'left' ? pnode.x - 46 : pnode.labelSide === 'right' ? pnode.x + 7 : pnode.x - 18;
        const ly =
          pnode.labelSide === 'above' ? pnode.y - 8 : pnode.labelSide === 'below' ? pnode.y + 18 : pnode.y + 4;
        ctx.fillText(pnode.label, lx, ly);
        ctx.restore();
      }
    }

    let lastNoise = 0;
    function animate() {
      animTRef.current++;
      const W = logicalW;
      const H = logicalH;

      ctx.fillStyle = '#030304';
      ctx.fillRect(0, 0, W, H);

      for (const s of starsRef.current) {
        ctx.save();
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const b of blocksRef.current) {
        if (Math.abs(b.alpha - b.alphaTarget) < 0.008) b.alphaTarget = 0.45 + Math.random() * 0.55;
        b.alpha += (b.alphaTarget - b.alpha) * b.alphaSpeed;
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.restore();
      }

      if (animTRef.current - lastNoise >= 2) {
        lastNoise = animTRef.current;
        buildNoise();
      }
      const nb = noiseRef.current;
      if (nb) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.putImageData(nb, 0, 0);
        ctx.restore();
      }

      const vig = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.08, W * 0.5, H * 0.5, W * 0.72);
      vig.addColorStop(0, 'rgba(3,3,4,0)');
      vig.addColorStop(0.6, 'rgba(3,3,4,0.3)');
      vig.addColorStop(1, 'rgba(3,3,4,0.8)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      netProgressRef.current += 0.0018;
      if (netProgressRef.current > 1.2) {
        netProgressRef.current = 0;
        initNetwork();
      }
      drawNetwork();

      rafRef.current = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(animate);

    const netIv = window.setInterval(initNetwork, 11000);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearInterval(netIv);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
