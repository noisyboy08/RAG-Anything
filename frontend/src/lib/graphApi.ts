import type { Edge, Node } from '../types';
import { apiFetch } from './api';

export type GraphDocument = {
  id: string;
  title: string;
  version: number;
  nodes: Node[];
  edges: Edge[];
  updated_at?: string;
};

export async function fetchGraph(graphId: string): Promise<GraphDocument> {
  const res = await apiFetch(`/graphs/${graphId}`);
  if (!res.ok) throw new Error(`Failed to fetch graph (${res.status})`);
  return (await res.json()) as GraphDocument;
}

export async function saveGraph(
  graphId: string,
  input: { title?: string; nodes: Node[]; edges: Edge[]; expectedVersion: number; idempotencyKey: string }
): Promise<{ id: string; version: number; idempotent_replay?: boolean }> {
  const res = await apiFetch(`/graphs/${graphId}`, {
    method: 'PUT',
    headers: { 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      title: input.title,
      data: { nodes: input.nodes, edges: input.edges },
      expected_version: input.expectedVersion
    })
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 409) {
    const d = body?.detail;
    const current =
      typeof d === 'object' && d !== null && 'current_version' in d
        ? (d as { current_version?: unknown }).current_version
        : undefined;
    const err = new Error('Version conflict');
    (err as Error & { code: string; currentVersion?: number }).code = 'version_conflict';
    (err as Error & { code: string; currentVersion?: number }).currentVersion =
      typeof current === 'number' ? current : undefined;
    throw err;
  }
  if (!res.ok) {
    const detail = body?.detail;
    const msg =
      typeof detail === 'string'
        ? detail
        : typeof detail === 'object' && detail !== null && 'message' in detail
          ? String((detail as { message: unknown }).message)
          : `Save failed (${res.status})`;
    throw new Error(msg);
  }
  return body as { id: string; version: number; idempotent_replay?: boolean };
}

export type NeighborRow = {
  node_id?: string;
  distance?: number;
  snippet?: string;
  [key: string]: unknown;
};

export async function fetchNeighborsFromNode(
  graphId: string,
  nodeId: string,
  limit = 20
): Promise<{ neighbors: NeighborRow[]; source_node_id: string; graph_id: string }> {
  const q = new URLSearchParams({ limit: String(limit) });
  const res = await apiFetch(`/graphs/${graphId}/neighbors/from-node/${encodeURIComponent(nodeId)}?${q}`);
  if (!res.ok) throw new Error(`Neighbors query failed (${res.status})`);
  return (await res.json()) as { neighbors: NeighborRow[]; source_node_id: string; graph_id: string };
}

export async function fetchNeighborsFromEmbedding(
  graphId: string,
  embedding: number[],
  opts?: { matchCount?: number; maxDistance?: number }
): Promise<{ neighbors: NeighborRow[]; graph_id: string }> {
  const res = await apiFetch(`/graphs/${graphId}/neighbors/query`, {
    method: 'POST',
    body: JSON.stringify({
      embedding,
      match_count: opts?.matchCount ?? 20,
      max_distance: opts?.maxDistance ?? 2.0
    })
  });
  if (!res.ok) throw new Error(`Embedding neighbors failed (${res.status})`);
  return (await res.json()) as { neighbors: NeighborRow[]; graph_id: string };
}
