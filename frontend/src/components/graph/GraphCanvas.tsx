import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGraphStore } from '../../store/graphStore';

/** Constructor registered by @mediapipe/hands IIFE (loaded via index.html, not bundled). */
type MediapipeHandsInstance = {
  setOptions: (opts: Record<string, unknown>) => void;
  onResults: (cb: (results: unknown) => void) => void;
  initialize: () => Promise<void>;
  send: (data: { image: HTMLCanvasElement }) => Promise<void>;
  close: () => Promise<void>;
};

type MediapipeHandsCtor = new (config: { locateFile?: (file: string) => string }) => MediapipeHandsInstance;

function getMediapipeHandsConstructor(): MediapipeHandsCtor | null {
  const H = (globalThis as unknown as { Hands?: MediapipeHandsCtor }).Hands;
  return typeof H === 'function' ? H : null;
}

export function GraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const raycasterRef = useRef<THREE.Raycaster>();
  const mouseRef = useRef(new THREE.Vector2());
  const nodeMeshesRef = useRef<THREE.Mesh[]>([]);
  const edgeLinesRef = useRef<THREE.Line[]>([]);
  const rafRef = useRef<number>();
  const handRafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const sphericalRef = useRef({ theta: 0.3, phi: 1.1, radius: 18 });
  const targetSphericalRef = useRef({ theta: 0.3, phi: 1.1, radius: 18 });
  const draggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const lastHandRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchRef = useRef(false);
  const lastSelectAtRef = useRef(0);
  const inferMsRef = useRef(0);
  const fpsRef = useRef({ last: performance.now(), frames: 0, value: 0 });
  const hoverNodeIdRef = useRef<string | null>(null);
  const layoutWorkerRef = useRef<Worker | null>(null);
  const recordingRef = useRef<Array<{ t: number; gesture: string; hands: number; fingersUp: number; pinchDist: number }>>([]);

  const [trackingMode, setTrackingMode] = useState<'auto' | 'off' | 'on'>('auto');
  const [pinchThreshold, setPinchThreshold] = useState(0.045);
  const [rotationDeadzone, setRotationDeadzone] = useState(5);
  const [pinchCooldownMs, setPinchCooldownMs] = useState(250);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [focusBackground, setFocusBackground] = useState(false);
  const [recording, setRecording] = useState(false);
  const [calib, setCalib] = useState({
    active: false,
    step: 'open' as 'open' | 'pinch' | 'twohand' | 'done',
    openSamples: [] as number[],
    pinchSamples: [] as number[],
    twoHandSamples: [] as number[]
  });
  const [hud, setHud] = useState({
    hands: 0,
    gesture: 'NONE',
    fingersUp: 0,
    pinchDist: 0,
    confidence: 0,
    tracking: 'idle',
    leftLabel: 'L: -',
    rightLabel: 'R: -',
    fps: 0,
    inferMs: 0
  });

  const { nodes, edges, selectedNodeId, selectNode, nodeFilters } = useGraphStore();
  const filtersRef = useRef(nodeFilters);
  useEffect(() => { filtersRef.current = nodeFilters; }, [nodeFilters]);

  const healthTone =
    hud.hands === 0 ? 'text-rose-300 border-rose-400/35 bg-rose-400/10'
      : hud.confidence >= 0.72 && hud.inferMs <= 24 ? 'text-emerald-200 border-emerald-400/35 bg-emerald-400/10'
      : 'text-amber-200 border-amber-400/35 bg-amber-400/10';

  useEffect(() => {
    const raw = localStorage.getItem('tot-session');
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (typeof s.theta === 'number') sphericalRef.current.theta = s.theta;
      if (typeof s.phi === 'number') sphericalRef.current.phi = s.phi;
      if (typeof s.radius === 'number') sphericalRef.current.radius = s.radius;
      targetSphericalRef.current = { ...sphericalRef.current };
      if (typeof s.pinchThreshold === 'number') setPinchThreshold(s.pinchThreshold);
      if (typeof s.rotationDeadzone === 'number') setRotationDeadzone(s.rotationDeadzone);
      if (typeof s.pinchCooldownMs === 'number') setPinchCooldownMs(s.pinchCooldownMs);
      if (typeof s.showLandmarks === 'boolean') setShowLandmarks(s.showLandmarks);
      if (typeof s.focusBackground === 'boolean') setFocusBackground(s.focusBackground);
      if (s.selectedNodeId) selectNode(s.selectedNodeId);
    } catch {
      // ignore
    }
  }, [selectNode]);

  useEffect(() => {
    const save = () => {
      localStorage.setItem(
        'tot-session',
        JSON.stringify({
          theta: sphericalRef.current.theta,
          phi: sphericalRef.current.phi,
          radius: sphericalRef.current.radius,
          selectedNodeId,
          pinchThreshold,
          rotationDeadzone,
          pinchCooldownMs,
          showLandmarks,
          focusBackground
        })
      );
    };
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
  }, [selectedNodeId, pinchThreshold, rotationDeadzone, pinchCooldownMs, showLandmarks, focusBackground]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04040a, 0.022);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x04040a, 0);
    rendererRef.current = renderer;
    raycasterRef.current = new THREE.Raycaster();
    scene.add(new THREE.AmbientLight(0x112233, 3));

    const starGeo = new THREE.BufferGeometry();
    const starPos: number[] = [];
    for (let i = 0; i < 2000; i++) starPos.push((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300);
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x334466, size: 0.15 })));

    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        return;
      }
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      targetSphericalRef.current.theta -= dx * 0.005;
      targetSphericalRef.current.phi = Math.max(0.15, Math.min(Math.PI - 0.15, targetSphericalRef.current.phi + dy * 0.005));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseDown = (e: MouseEvent) => { draggingRef.current = true; lastMouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { draggingRef.current = false; };
    const onWheel = (e: WheelEvent) => { targetSphericalRef.current.radius = Math.max(6, Math.min(40, targetSphericalRef.current.radius + e.deltaY * 0.02)); };
    const onClick = () => {
      if (!raycasterRef.current || !cameraRef.current) return;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const hits = raycasterRef.current.intersectObjects(nodeMeshesRef.current);
      selectNode(hits.length ? (hits[0].object.userData.nodeId as string) : null);
    };
    const canvas = canvasRef.current;
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel);
    canvas.addEventListener('click', onClick);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
      fpsRef.current.frames += 1;
      const now = performance.now();
      if (now - fpsRef.current.last >= 1000) {
        fpsRef.current.value = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.last = now;
      }
      const s = sphericalRef.current;
      const t = targetSphericalRef.current;
      s.theta += (t.theta - s.theta) * 0.07;
      s.phi += (t.phi - s.phi) * 0.07;
      s.radius += (t.radius - s.radius) * 0.07;
      cameraRef.current.position.set(s.radius * Math.sin(s.phi) * Math.sin(s.theta), s.radius * Math.cos(s.phi), s.radius * Math.sin(s.phi) * Math.cos(s.theta));
      cameraRef.current.lookAt(0, 0, 0);
      const time = Date.now() * 0.001;
      nodeMeshesRef.current.forEach((mesh) => {
        const isSel = mesh.userData.nodeId === selectedNodeId;
        mesh.scale.setScalar(1 + 0.05 * Math.sin(time * 1.4) + (isSel ? 0.2 : 0));
        mesh.rotation.y += 0.01;
      });
      if (raycasterRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const hits = raycasterRef.current.intersectObjects(nodeMeshesRef.current);
        hoverNodeIdRef.current = hits.length ? (hits[0].object.userData.nodeId as string) : null;
      }
      // Basic render culling and filtering
      const cam = cameraRef.current.position;
      const filters = filtersRef.current;
      nodeMeshesRef.current.forEach((mesh) => {
        const eType = mesh.userData.entityType || 'text';
        const isVisibleType = filters[eType] !== false;
        mesh.visible = isVisibleType && mesh.position.distanceToSquared(cam) < 2600;
      });
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    const videoEl = document.getElementById('webcam-bg') as HTMLVideoElement | null;
    let hands: MediapipeHandsInstance | null = null;
    if (videoEl) {
      videoEl.classList.toggle('focus', focusBackground);
      const HandsCtor = getMediapipeHandsConstructor();
      if (!HandsCtor) {
        setHud((h) => ({ ...h, tracking: 'hands_lib_missing' }));
      }
      hands = HandsCtor
        ? new HandsCtor({
            locateFile: (file) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
          })
        : null;
      if (hands) {
        hands.setOptions({
          selfieMode: false,
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

      hands.onResults((results: any) => {
        if (trackingMode === 'off') return;
        if (!cameraRef.current || !raycasterRef.current) return;
        const drawCanvas = drawCanvasRef.current;
        const drawCtx = drawCanvas?.getContext('2d');
        if (drawCanvas && drawCtx) {
          drawCanvas.width = window.innerWidth;
          drawCanvas.height = window.innerHeight;
          drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        }
        const lmList = results.multiHandLandmarks || [];
        const handed = results.multiHandedness || [];
        if (!lmList.length) {
          lastHandRef.current = null;
          lastPinchRef.current = false;
          setHud((h) => ({ ...h, tracking: 'searching', hands: 0, gesture: 'NONE', fingersUp: 0, pinchDist: 0, confidence: 0, fps: fpsRef.current.value, inferMs: Number(inferMsRef.current.toFixed(1)) }));
          return;
        }

        const validHands = lmList.filter((hand: any[]) => {
          const xs = hand.map((p) => p.x);
          const ys = hand.map((p) => p.y);
          const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
          return area > 0.03;
        });
        if (!validHands.length) return;

        const h0 = validHands[0];
        const wrist = h0[0];
        const thumb = h0[4];
        const index = h0[8];
        mouseRef.current.x = index.x * 2 - 1;
        mouseRef.current.y = -(index.y * 2 - 1);

        const wristPx = { x: wrist.x * window.innerWidth, y: wrist.y * window.innerHeight };
        if (lastHandRef.current) {
          const dx = wristPx.x - lastHandRef.current.x;
          const dy = wristPx.y - lastHandRef.current.y;
          if (Math.hypot(dx, dy) > rotationDeadzone) {
            targetSphericalRef.current.theta -= dx * 0.0038;
            targetSphericalRef.current.phi = Math.max(0.15, Math.min(Math.PI - 0.15, targetSphericalRef.current.phi + dy * 0.0038));
          }
        }
        lastHandRef.current = wristPx;

        if (validHands.length > 1) {
          const d = Math.hypot(validHands[0][0].x - validHands[1][0].x, validHands[0][0].y - validHands[1][0].y);
          targetSphericalRef.current.radius = Math.max(6, Math.min(40, 7 + d * 35));
        }

        const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
        const pinch = pinchDist < pinchThreshold;
        const fingersUp = estimateFingersUp(h0, handed?.[0]?.label || 'Right');
        const gesture = validHands.length > 1 ? 'TWO-HAND' : pinch ? 'PINCH' : 'POINT';
        const conf = Number(((handed?.[0]?.score ?? 0.6) as number).toFixed(2));
        const left = handed?.find((h: any) => h.label === 'Left')?.score;
        const right = handed?.find((h: any) => h.label === 'Right')?.score;
        setHud({
          hands: validHands.length,
          gesture,
          fingersUp,
          pinchDist: Number(pinchDist.toFixed(3)),
          confidence: conf,
          tracking: 'locked',
          leftLabel: `L: ${left ? left.toFixed(2) : '-'}`,
          rightLabel: `R: ${right ? right.toFixed(2) : '-'}`,
          fps: fpsRef.current.value,
          inferMs: Number(inferMsRef.current.toFixed(1))
        });

        if (pinch && !lastPinchRef.current && Date.now() - lastSelectAtRef.current > pinchCooldownMs) {
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
          const hits = raycasterRef.current.intersectObjects(nodeMeshesRef.current);
          selectNode(hits.length ? (hits[0].object.userData.nodeId as string) : null);
          lastSelectAtRef.current = Date.now();
        }
        lastPinchRef.current = pinch;

        if (recording) {
          recordingRef.current.push({ t: Date.now(), gesture, hands: validHands.length, fingersUp, pinchDist: Number(pinchDist.toFixed(3)) });
          if (recordingRef.current.length > 400) recordingRef.current.shift();
        }

        if (calib.active) {
          if (calib.step === 'open' && fingersUp >= 4) setCalib((c) => ({ ...c, openSamples: [...c.openSamples, pinchDist] }));
          else if (calib.step === 'pinch' && pinch) setCalib((c) => ({ ...c, pinchSamples: [...c.pinchSamples, pinchDist] }));
          else if (calib.step === 'twohand' && validHands.length > 1) {
            const d = Math.hypot(validHands[0][0].x - validHands[1][0].x, validHands[0][0].y - validHands[1][0].y);
            setCalib((c) => ({ ...c, twoHandSamples: [...c.twoHandSamples, d] }));
          }
        }

        if (drawCanvas && drawCtx && showLandmarks) {
          drawCtx.strokeStyle = 'rgba(74,240,255,0.8)';
          drawCtx.fillStyle = 'rgba(232,255,90,0.9)';
          drawCtx.lineWidth = 2;
          const con = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
          validHands.forEach((hand: any[]) => {
            con.forEach(([a,b]) => {
              const x1 = drawCanvas.width - hand[a].x * drawCanvas.width;
              const y1 = hand[a].y * drawCanvas.height;
              const x2 = drawCanvas.width - hand[b].x * drawCanvas.width;
              const y2 = hand[b].y * drawCanvas.height;
              drawCtx.beginPath();
              drawCtx.moveTo(x1, y1);
              drawCtx.lineTo(x2, y2);
              drawCtx.stroke();
            });
            hand.forEach((p: any) => {
              drawCtx.beginPath();
              drawCtx.arc(drawCanvas.width - p.x * drawCanvas.width, p.y * drawCanvas.height, 4, 0, Math.PI * 2);
              drawCtx.fill();
            });
          });
        }

        if (drawCanvas && drawCtx && hoverNodeIdRef.current) {
          const mesh = nodeMeshesRef.current.find((m) => m.userData.nodeId === hoverNodeIdRef.current);
          if (mesh && cameraRef.current) {
            const p = mesh.position.clone().project(cameraRef.current);
            const x = (p.x * 0.5 + 0.5) * drawCanvas.width;
            const y = (-p.y * 0.5 + 0.5) * drawCanvas.height;
            drawCtx.beginPath();
            drawCtx.strokeStyle = 'rgba(255,204,68,0.95)';
            drawCtx.lineWidth = 2;
            drawCtx.arc(x, y, 12, 0, Math.PI * 2);
            drawCtx.stroke();
          }
        }
      });
      }

      (async () => {
        try {
          streamRef.current = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: false
          });
          videoEl.srcObject = streamRef.current;
          await videoEl.play();
          const procCanvas = document.createElement('canvas');
          const procCtx = procCanvas.getContext('2d');
          const process = async () => {
            if (!videoEl || !procCtx) return;
            const t0 = performance.now();
            if (videoEl.readyState >= 2) {
              const w = videoEl.videoWidth || 640;
              const h = videoEl.videoHeight || 480;
              procCanvas.width = w;
              procCanvas.height = h;
              procCtx.save();
              procCtx.filter = 'brightness(1.25) contrast(1.2) saturate(1.15)';
              procCtx.drawImage(videoEl, 0, 0, w, h);
              procCtx.restore();
              if (trackingMode !== 'off' && hands) await hands.send({ image: procCanvas });
            }
            inferMsRef.current = performance.now() - t0;
            handRafRef.current = requestAnimationFrame(process);
          };
          process();
        } catch {
          setHud((h) => ({ ...h, tracking: 'camera_blocked' }));
        }
      })();
    }

    return () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (handRafRef.current) cancelAnimationFrame(handRafRef.current);
      void hands?.close?.();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (layoutWorkerRef.current) {
        layoutWorkerRef.current.terminate();
        layoutWorkerRef.current = null;
      }
      renderer.dispose();
    };
  }, [focusBackground, pinchCooldownMs, pinchThreshold, recording, rotationDeadzone, selectNode, selectedNodeId, showLandmarks, trackingMode, calib.active, calib.step]);

  useEffect(() => {
    if (!calib.active) return;
    const id = setInterval(() => {
      setCalib((c) => {
        if (c.step === 'open' && c.openSamples.length >= 25) return { ...c, step: 'pinch' };
        if (c.step === 'pinch' && c.pinchSamples.length >= 20) return { ...c, step: 'twohand' };
        if (c.step === 'twohand' && c.twoHandSamples.length >= 20) {
          const dynamic = Math.max(0.02, Math.min(0.07, (avg(c.openSamples) + avg(c.pinchSamples)) / 2));
          setPinchThreshold(dynamic);
          return { ...c, active: false, step: 'done' };
        }
        return c;
      });
    }, 300);
    return () => clearInterval(id);
  }, [calib.active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (trackingMode !== 'off') return;
      if (e.key === 'ArrowLeft') targetSphericalRef.current.theta += 0.08;
      if (e.key === 'ArrowRight') targetSphericalRef.current.theta -= 0.08;
      if (e.key === 'ArrowUp') targetSphericalRef.current.phi = Math.max(0.15, targetSphericalRef.current.phi - 0.08);
      if (e.key === 'ArrowDown') targetSphericalRef.current.phi = Math.min(Math.PI - 0.15, targetSphericalRef.current.phi + 0.08);
      if (e.key === '+' || e.key === '=') targetSphericalRef.current.radius = Math.max(6, targetSphericalRef.current.radius - 1);
      if (e.key === '-') targetSphericalRef.current.radius = Math.min(40, targetSphericalRef.current.radius + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trackingMode]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (!layoutWorkerRef.current) {
      layoutWorkerRef.current = new Worker(new URL('../../workers/layoutWorker.ts', import.meta.url), { type: 'module' });
    }
    nodeMeshesRef.current.forEach((m) => sceneRef.current!.remove(m));
    edgeLinesRef.current.forEach((l) => sceneRef.current!.remove(l));
    nodeMeshesRef.current = [];
    edgeLinesRef.current = [];
    if (!nodes.length) return;
    const worker = layoutWorkerRef.current;
    worker.onmessage = (ev: MessageEvent<{ positions: Record<string, { x: number; y: number; z: number }> }>) => {
      const p = ev.data.positions;
      const positions: Record<string, THREE.Vector3> = {};
      nodes.forEach((n) => {
        const pos = p[n.id] || { x: 0, y: 0, z: 0 };
        positions[n.id] = new THREE.Vector3(pos.x, pos.y, pos.z);
      });
      nodes.forEach((n) => {
        const typeStr = n.entity_type || 'text';
        let color = 0x4af0ff; // text (cyan)
        if (typeStr === 'image') color = 0x00ffb4; // image (emerald)
        else if (typeStr === 'table') color = 0xa78bfa; // table (violet)
        else if (typeStr === 'equation') color = 0xf472b6; // equation (pink)
        
        const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), mat);
        mesh.position.copy(positions[n.id]);
        mesh.userData.nodeId = n.id;
        mesh.userData.entityType = typeStr;
        sceneRef.current!.add(mesh);
        nodeMeshesRef.current.push(mesh);
      });
      edges.forEach((e) => {
        const a = positions[e.sourceNodeId];
        const b = positions[e.targetNodeId];
        if (!a || !b) return;
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([a, b]),
          new THREE.LineBasicMaterial({ color: 0x00ffb4, transparent: true, opacity: Math.min(0.8, e.weight * 0.9) })
        );
        sceneRef.current!.add(line);
        edgeLinesRef.current.push(line);
      });
    };
    worker.postMessage({ nodes: nodes.map((n) => ({ id: n.id })), radius: 6 });
  }, [nodes, edges]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      <canvas ref={drawCanvasRef} className="absolute inset-0 z-10 pointer-events-none" />
      <div className="absolute bottom-5 left-5 z-20 w-[290px] rounded-2xl border border-emerald-400/25 bg-black/55 p-3 text-[11px] leading-5 tracking-wide text-emerald-200 backdrop-blur-lg">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/90">Tracking Telemetry</span>
          <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] ${healthTone}`}>
            {hud.hands === 0 ? 'No signal' : hud.confidence >= 0.72 && hud.inferMs <= 24 ? 'Stable' : 'Degraded'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3">
          <div>tracking: {hud.tracking}</div>
          <div>mode: {trackingMode}</div>
          <div>hands: {hud.hands}</div>
          <div>gesture: {hud.gesture}</div>
          <div>fingers: {hud.fingersUp}</div>
          <div>confidence: {hud.confidence}</div>
          <div>pinch dist: {hud.pinchDist}</div>
          <div>fps: {hud.fps}</div>
        </div>
        <div className="mt-1">{hud.leftLabel} | {hud.rightLabel}</div>
        <div>inference: {hud.inferMs}ms</div>
      </div>
      <div className="absolute top-20 right-5 z-20 w-72 space-y-2 rounded-2xl border border-cyan-400/30 bg-black/65 px-4 py-3 text-[11px] text-cyan-100 backdrop-blur-lg">
        <div className="font-semibold uppercase tracking-[0.18em] text-cyan-300">Tracking Controls</div>
        <div className="flex gap-2">
          <button className="rounded border border-cyan-400/45 px-2 py-1 transition hover:bg-cyan-400/10" onClick={() => setTrackingMode('auto')}>AUTO</button>
          <button className="rounded border border-cyan-400/45 px-2 py-1 transition hover:bg-cyan-400/10" onClick={() => setTrackingMode('on')}>HANDS</button>
          <button className="rounded border border-cyan-400/45 px-2 py-1 transition hover:bg-cyan-400/10" onClick={() => setTrackingMode('off')}>MOUSE/KEY</button>
        </div>
        <label className="block text-cyan-100/95">pinch threshold: {pinchThreshold.toFixed(3)}
          <input type="range" min="0.02" max="0.08" step="0.001" value={pinchThreshold} onChange={(e) => setPinchThreshold(Number(e.target.value))} className="w-full" />
        </label>
        <label className="block text-cyan-100/95">rotation deadzone: {rotationDeadzone}px
          <input type="range" min="1" max="20" step="1" value={rotationDeadzone} onChange={(e) => setRotationDeadzone(Number(e.target.value))} className="w-full" />
        </label>
        <label className="block text-cyan-100/95">pinch cooldown: {pinchCooldownMs}ms
          <input type="range" min="50" max="800" step="10" value={pinchCooldownMs} onChange={(e) => setPinchCooldownMs(Number(e.target.value))} className="w-full" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="rounded border border-cyan-400/45 px-2 py-1 transition hover:bg-cyan-400/10" onClick={() => setShowLandmarks((v) => !v)}>landmarks: {showLandmarks ? 'on' : 'off'}</button>
          <button className="rounded border border-cyan-400/45 px-2 py-1 transition hover:bg-cyan-400/10" onClick={() => setFocusBackground((v) => !v)}>bg focus: {focusBackground ? 'on' : 'off'}</button>
          <button className="rounded border border-cyan-400/45 px-2 py-1 transition hover:bg-cyan-400/10" onClick={() => setRecording((v) => !v)}>record: {recording ? 'on' : 'off'}</button>
          <button className="rounded border border-cyan-400/45 px-2 py-1 transition hover:bg-cyan-400/10" onClick={() => setCalib({ active: true, step: 'open', openSamples: [], pinchSamples: [], twoHandSamples: [] })}>calibrate</button>
          <button className="rounded border border-cyan-400/45 px-2 py-1 transition hover:bg-cyan-400/10" onClick={() => {
            const blob = new Blob([JSON.stringify(recordingRef.current, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gesture-log.json';
            a.click();
            URL.revokeObjectURL(url);
          }}>export log</button>
        </div>
        {calib.active && <div className="text-yellow-300">calibration step: {calib.step}</div>}
      </div>
    </div>
  );
}

function estimateFingersUp(hand: { x: number; y: number }[], handednessLabel: string): number {
  let count = 0;
  const pairs = [[8, 6], [12, 10], [16, 14], [20, 18]] as const;
  pairs.forEach(([tip, pip]) => {
    if (hand[tip].y < hand[pip].y) count++;
  });
  if (handednessLabel === 'Right') {
    if (hand[4].x < hand[3].x) count++;
  } else if (hand[4].x > hand[3].x) {
    count++;
  }
  return count;
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
