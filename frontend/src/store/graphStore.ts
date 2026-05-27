import { create } from 'zustand';
import type { Node, Edge } from '../types';
import { fetchGraph, saveGraph } from '../lib/graphApi';

async function resolveServerVersion(
  graphId: string,
  hint?: number
): Promise<number | undefined> {
  if (typeof hint === 'number') return hint;
  try {
    const doc = await fetchGraph(graphId);
    return doc.version;
  } catch {
    return undefined;
  }
}

interface GraphState {
  graphId: string;
  title: string;
  version: number;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  saveState: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  saveError: string | null;
  dirty: boolean;
  queueLength: number;
  setGraph: (nodes: Node[], edges: Edge[]) => void;
  loadGraph: (graphId: string) => Promise<void>;
  saveNow: () => Promise<void>;
  startAutoSave: () => void;
  stopAutoSave: () => void;
  updateNodeSnippet: (id: string, snippet: string) => void;
  selectNode: (id: string | null) => void;
  nodeFilters: Record<string, boolean>;
  toggleNodeFilter: (type: string) => void;
}

const mockNodes: Node[] = [
  {
    id: 'n0',
    label: 'Topology Engine',
    snippet: 'Core architecture of how thought-nodes relate and organize.',
    clusterIndex: 0,
    centralSimilarity: 1,
    connectionsCount: 6
  },
  {
    id: 'n1',
    label: 'Embedding Space',
    snippet: 'High-dimensional vector space where semantic proximity encodes meaning.',
    clusterIndex: 0,
    centralSimilarity: 0.88,
    connectionsCount: 5
  },
  {
    id: 'n2',
    label: 'Information Tools',
    snippet: 'Historical pattern recognition and artificial memory systems.',
    clusterIndex: 1,
    centralSimilarity: 0.7,
    connectionsCount: 3
  },
  {
    id: 'n3',
    label: 'Artificial Life',
    snippet: 'Self-organization and morphogenesis in complex systems.',
    clusterIndex: 2,
    centralSimilarity: 0.55,
    connectionsCount: 3
  }
];

const mockEdges: Edge[] = [
  { id: 'e0', sourceNodeId: 'n0', targetNodeId: 'n1', weight: 0.92 },
  { id: 'e1', sourceNodeId: 'n0', targetNodeId: 'n2', weight: 0.78 },
  { id: 'e2', sourceNodeId: 'n1', targetNodeId: 'n3', weight: 0.75 },
  { id: 'e3', sourceNodeId: 'n2', targetNodeId: 'n3', weight: 0.7 }
];

export const useGraphStore = create<GraphState>((set) => ({
  graphId: 'demo-graph',
  title: 'Demo graph',
  version: 0,
  nodes: mockNodes,
  edges: mockEdges,
  selectedNodeId: null,
  focusNodeSeq: 0,
  saveState: 'idle',
  saveError: null,
  dirty: false,
  queueLength: 0,
  nodeFilters: { text: true, image: true, table: true, equation: true },
  toggleNodeFilter: (type: string) => set((s) => ({
    nodeFilters: { ...s.nodeFilters, [type]: !s.nodeFilters[type] }
  })),
  setGraph: (nodes, edges) => set({ nodes, edges, dirty: true, queueLength: 1 }),
  loadGraph: async (graphId) => {
    const doc = await fetchGraph(graphId);
    set({
      graphId: doc.id,
      title: doc.title,
      version: doc.version,
      nodes: doc.nodes,
      edges: doc.edges,
      saveState: 'idle',
      saveError: null,
      dirty: false,
      queueLength: 0,
    });
  },
  saveNow: async () => {
    const s = useGraphStore.getState();
    if (!s.dirty) return;
    set({ saveState: 'saving', saveError: null });
    const key = `graph-${s.graphId}-${s.version}-${Date.now()}`;
    try {
      const out = await saveGraph(s.graphId, {
        title: s.title,
        nodes: s.nodes,
        edges: s.edges,
        expectedVersion: s.version,
        idempotencyKey: key,
      });
      set({
        version: out.version,
        saveState: 'saved',
        saveError: null,
        dirty: false,
        queueLength: 0,
      });
    } catch (e) {
      const err = e as Error & { code?: string; currentVersion?: number };
      if (err.code === 'version_conflict') {
        const serverVersion = await resolveServerVersion(s.graphId, err.currentVersion);
        if (typeof serverVersion !== 'number') {
          set({
            saveState: 'conflict',
            saveError: 'Version conflict: could not read server version. Reload the graph.',
          });
          return;
        }
        // Rebase: keep local nodes/edges; align expected_version to current server row.
        set({ version: serverVersion, saveState: 'saving', saveError: null });
        const afterRebase = useGraphStore.getState();
        try {
          const out = await saveGraph(afterRebase.graphId, {
            title: afterRebase.title,
            nodes: afterRebase.nodes,
            edges: afterRebase.edges,
            expectedVersion: serverVersion,
            idempotencyKey: `${key}-rebase-${Date.now()}`,
          });
          set({
            version: out.version,
            saveState: 'saved',
            saveError: null,
            dirty: false,
            queueLength: 0,
          });
          return;
        } catch (e2) {
          const err2 = e2 as Error & { code?: string; currentVersion?: number };
          if (err2.code === 'version_conflict') {
            set({
              saveState: 'conflict',
              saveError: `Still out of date after rebase (server v${err2.currentVersion ?? '?'}). Reload or retry.`,
            });
            return;
          }
          set((prev) => ({
            saveState: 'error',
            saveError: (e2 as Error).message || 'Save failed after rebase',
            queueLength: Math.max(1, prev.queueLength),
          }));
        }
      } else {
        set((prev) => ({
          saveState: 'error',
          saveError: err.message || 'Autosave failed',
          queueLength: Math.max(1, prev.queueLength),
        }));
      }
      // retry transient errors with bounded backoff
      const attempts = [750, 2000, 5000];
      for (const delay of attempts) {
        await new Promise((r) => setTimeout(r, delay));
        const latest = useGraphStore.getState();
        if (!latest.dirty) return;
        try {
          const retry = await saveGraph(latest.graphId, {
            title: latest.title,
            nodes: latest.nodes,
            edges: latest.edges,
            expectedVersion: latest.version,
            idempotencyKey: `${key}-r${delay}`,
          });
          set({
            version: retry.version,
            saveState: 'saved',
            saveError: null,
            dirty: false,
            queueLength: 0,
          });
          return;
        } catch {
          // keep trying
        }
      }
    }
  },
  startAutoSave: () => {
    const key = '__totAutosaveTimer';
    const g = globalThis as typeof globalThis & { [k: string]: unknown };
    if (typeof g[key] === 'number') return;
    const id = window.setInterval(() => {
      const s = useGraphStore.getState();
      if (!s.dirty || s.saveState === 'saving') return;
      void s.saveNow();
    }, 1200);
    g[key] = id;
  },
  stopAutoSave: () => {
    const key = '__totAutosaveTimer';
    const g = globalThis as typeof globalThis & { [k: string]: unknown };
    if (typeof g[key] === 'number') {
      window.clearInterval(g[key] as number);
      g[key] = undefined;
    }
  },
  updateNodeSnippet: (id, snippet) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, snippet } : n)),
      dirty: true,
      queueLength: s.queueLength + 1,
    })),
  selectNode: (id) => set({ selectedNodeId: id })
}));

