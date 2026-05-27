type NodeIn = { id: string };
type MsgIn = { nodes: NodeIn[]; radius?: number };
type MsgOut = { positions: Record<string, { x: number; y: number; z: number }> };

self.onmessage = (e: MessageEvent<MsgIn>) => {
  const nodes = Array.isArray(e.data?.nodes) ? e.data.nodes : [];
  const radius = Math.max(2, Number(e.data?.radius ?? 6));
  const positions: Record<string, { x: number; y: number; z: number }> = {};
  if (!nodes.length) {
    (self as unknown as Worker).postMessage({ positions } satisfies MsgOut);
    return;
  }

  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nodes.length; i++) {
    const y = 1 - (i / Math.max(1, nodes.length - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    positions[nodes[i].id] = { x: Math.cos(theta) * r * radius, y: y * radius * 0.7, z: Math.sin(theta) * r * radius };
  }

  (self as unknown as Worker).postMessage({ positions } satisfies MsgOut);
};
