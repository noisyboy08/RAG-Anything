import { GraphCanvas } from '../components/graph/GraphCanvas';
import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGraphStore } from '../store/graphStore';
import { fetchNeighborsFromEmbedding, fetchNeighborsFromNode, type NeighborRow } from '../lib/graphApi';
import { apiFetch } from '../lib/api';

type PanelTab = 'query' | 'neighbors' | 'upload' | 'filters';

export function GraphPage() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [params] = useSearchParams();
  const [panelTab, setPanelTab] = useState<PanelTab>('query');

  // RAG Query
  const [queryText, setQueryText] = useState('');
  const [queryMode, setQueryMode] = useState<'mix'|'local'|'global'|'hybrid'|'naive'>('mix');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryAnswer, setQueryAnswer] = useState<string|null>(null);
  const [queryError, setQueryError] = useState<string|null>(null);

  // Neighbor search
  const [panelNeighborTab, setPanelNeighborTab] = useState<'from-node'|'embedding'>('from-node');
  const [fromNodeNeighbors, setFromNodeNeighbors] = useState<NeighborRow[]>([]);
  const [embeddingNeighbors, setEmbeddingNeighbors] = useState<NeighborRow[]>([]);
  const [nodeQueryLoading, setNodeQueryLoading] = useState(false);
  const [embeddingQueryLoading, setEmbeddingQueryLoading] = useState(false);
  const [fromNodeError, setFromNodeError] = useState<string|null>(null);
  const [embeddingError, setEmbeddingError] = useState<string|null>(null);
  const [embeddingJson, setEmbeddingJson] = useState('');
  const [embeddingMatchCount, setEmbeddingMatchCount] = useState(8);
  const [embeddingMaxDistance, setEmbeddingMaxDistance] = useState(2);

  // Upload
  const [uploadFile, setUploadFile] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string|null>(null);

  const {
    saveState, saveError, startAutoSave, stopAutoSave,
    loadGraph, graphId, selectedNodeId, nodes, nodeFilters, toggleNodeFilter
  } = useGraphStore();

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

  useEffect(() => {
    document.getElementById('root')?.classList.add('app-workspace');
    startAutoSave();
    return () => { stopAutoSave(); document.getElementById('root')?.classList.remove('app-workspace'); };
  }, []);

  useEffect(() => {
    const fromQuery = params.get('graph')?.trim();
    const fromEnv = (import.meta.env.VITE_GRAPH_ID as string|undefined)?.trim();
    const id = fromQuery || fromEnv;
    if (!id) return;
    void loadGraph(id).catch(() => {});
  }, [params, loadGraph]);

  const handleRagQuery = async () => {
    if (!queryText.trim()) return;
    setQueryLoading(true); setQueryAnswer(null); setQueryError(null);
    try {
      const res = await apiFetch('/query', {
        method: 'POST',
        body: JSON.stringify({ query: queryText, mode: queryMode }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json() as { answer?: string };
      setQueryAnswer(data.answer ?? JSON.stringify(data));
    } catch (e) {
      setQueryError((e as Error).message || 'Query failed');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleFindNeighborsFromNode = async () => {
    if (!selectedNodeId) return;
    setNodeQueryLoading(true); setFromNodeError(null);
    try {
      const rows = await fetchNeighborsFromNode(graphId, selectedNodeId, { topK: 8 });
      setFromNodeNeighbors(rows);
    } catch (e) {
      setFromNodeError((e as Error).message);
    } finally {
      setNodeQueryLoading(false);
    }
  };

  const handleEmbeddingQuery = async () => {
    setEmbeddingQueryLoading(true); setEmbeddingError(null);
    try {
      const vec = JSON.parse(embeddingJson.trim()) as number[];
      const rows = await fetchNeighborsFromEmbedding(graphId, vec, { topK: embeddingMatchCount, maxDistance: embeddingMaxDistance });
      setEmbeddingNeighbors(rows);
    } catch (e) {
      setEmbeddingError((e as Error).message);
    } finally {
      setEmbeddingQueryLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true); setUploadStatus(null);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      const res = await apiFetch('/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      setUploadStatus('✓ Uploaded and queued for processing');
      setUploadFile(null);
    } catch (e) {
      setUploadStatus(`Error: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const tabs: { key: PanelTab; label: string }[] = [
    { key: 'query', label: '💬 Query' },
    { key: 'neighbors', label: '🔗 Neighbors' },
    { key: 'upload', label: '📤 Upload' },
    { key: 'filters', label: '🎛 Filters' },
  ];

  const entityTypeColors: Record<string, string> = {
    text: '#4af0ff', image: '#e8ff5a', table: '#a78bfa', equation: '#f472b6',
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '100dvh', background: '#000000' }}>
      {/* ── GRAPH CANVAS ── */}
      <GraphCanvas />

      {/* ── TOP BAR ── */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Logo */}
        <Link to="/" className="pointer-events-auto flex items-center gap-2 no-underline"
          style={{ padding:'8px 14px', borderRadius:'12px', background:'rgba(5,9,20,0.85)', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(16px)' }}>
          <span style={{ width:'8px',height:'8px',borderRadius:'50%',background:'#e8ff5a',boxShadow:'0 0 10px #e8ff5a' }} />
          <span style={{ color:'white',fontWeight:700,fontSize:'13px',fontFamily:"'Space Grotesk', system-ui" }}>RAG-Anything</span>
          <span style={{ color:'rgba(255,255,255,0.3)',fontSize:'11px' }}>/ Graph</span>
        </Link>

        {/* Status */}
        <div className="pointer-events-auto flex items-center gap-2">
          <span style={{ padding:'6px 12px', borderRadius:'9999px', background:'rgba(5,9,20,0.85)', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(12px)', fontSize:'10px', letterSpacing:'0.15em', textTransform:'uppercase', color: saveState==='saved'?'#e8ff5a':saveState==='error'?'#f87171':'rgba(255,255,255,0.55)' }}>
            {saveState}
          </span>
          <button onClick={() => setHelpOpen(v => !v)}
            style={{ width:'34px',height:'34px',borderRadius:'10px',background:'rgba(5,9,20,0.85)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(12px)',color:'rgba(255,255,255,0.55)',fontSize:'14px',cursor:'pointer',display:'grid',placeItems:'center' }}>
            ?
          </button>
        </div>
      </div>

      {/* ── NODE DETAIL (top-right when selected) ── */}
      {selectedNode && (
        <div className="absolute z-30" style={{ top:'72px',right:'16px',width:'280px',background:'rgba(5,9,20,0.92)',border:'1px solid rgba(74,240,255,0.25)',borderRadius:'16px',padding:'1rem',backdropFilter:'blur(20px)' }}>
          <div style={{ fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#4af0ff',marginBottom:'8px' }}>Selected Node</div>
          <div style={{ fontWeight:700,fontSize:'14px',color:'white',marginBottom:'6px' }}>{selectedNode.label}</div>
          <div style={{ fontSize:'12px',color:'rgba(255,255,255,0.45)',lineHeight:1.6,marginBottom:'10px' }}>{selectedNode.snippet}</div>
          <div style={{ display:'flex',justifyContent:'space-between',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'8px' }}>
            <span style={{ fontSize:'11px',color: entityTypeColors[selectedNode.entity_type||'text']||'#4af0ff' }}>⬤ {selectedNode.entity_type||'text'}</span>
            <span style={{ fontSize:'11px',color:'rgba(255,255,255,0.35)' }}>{selectedNode.connectionsCount} edges</span>
          </div>
        </div>
      )}

      {/* ── RIGHT PANEL ── */}
      <div className="absolute bottom-6 right-4 z-30" style={{ width:'320px' }}>
        {/* Tab bar */}
        <div style={{ display:'flex',gap:'4px',background:'rgba(5,9,20,0.9)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',padding:'4px',marginBottom:'6px',backdropFilter:'blur(20px)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setPanelTab(t.key)}
              style={{ flex:1,padding:'6px 4px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'10px',fontWeight:600,fontFamily:'inherit',transition:'all 0.2s',
                background: panelTab===t.key?'rgba(232,255,90,0.15)':'transparent',
                color: panelTab===t.key?'#e8ff5a':'rgba(255,255,255,0.35)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel body */}
        <div style={{ background:'rgba(5,9,20,0.92)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'14px',padding:'1rem',backdropFilter:'blur(20px)',maxHeight:'420px',overflowY:'auto' }}>

          {/* QUERY TAB */}
          {panelTab==='query' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
              <div style={{ fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#e8ff5a' }}>RAG Query</div>
              <textarea
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                placeholder="Ask a question about your documents..."
                rows={3}
                style={{ width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.65)',fontSize:'12px',resize:'none',outline:'none',fontFamily:'inherit',lineHeight:1.6,boxSizing:'border-box' }}
              />
              <div style={{ display:'flex',gap:'6px',alignItems:'center' }}>
                <select value={queryMode} onChange={e => setQueryMode(e.target.value as typeof queryMode)}
                  style={{ flex:1,padding:'6px 10px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(5,9,20,0.8)',color:'rgba(255,255,255,0.65)',fontSize:'11px',fontFamily:'inherit' }}>
                  {['mix','local','global','hybrid','naive'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={() => void handleRagQuery()} disabled={queryLoading||!queryText.trim()}
                  style={{ padding:'7px 14px',borderRadius:'8px',border:'none',background:'linear-gradient(135deg,#e8ff5a,#4af0ff)',color:'#000000',fontWeight:700,fontSize:'11px',cursor:'pointer',fontFamily:'inherit',opacity:queryLoading?0.6:1 }}>
                  {queryLoading?'…':'Ask'}
                </button>
              </div>
              {queryError && <div style={{ color:'#f87171',fontSize:'11px',padding:'8px',background:'rgba(248,113,113,0.08)',borderRadius:'8px' }}>{queryError}</div>}
              {queryAnswer && (
                <div style={{ padding:'10px',background:'rgba(232,255,90,0.05)',border:'1px solid rgba(232,255,90,0.15)',borderRadius:'10px',fontSize:'12px',color:'#a0c0b0',lineHeight:1.7,whiteSpace:'pre-wrap',maxHeight:'180px',overflowY:'auto' }}>
                  {queryAnswer}
                </div>
              )}
            </div>
          )}

          {/* NEIGHBORS TAB */}
          {panelTab==='neighbors' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
              <div style={{ display:'flex',gap:'4px',background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'3px' }}>
                {(['from-node','embedding'] as const).map(t => (
                  <button key={t} onClick={() => setPanelNeighborTab(t)}
                    style={{ flex:1,padding:'5px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'10px',fontFamily:'inherit',
                      background:panelNeighborTab===t?'rgba(139,92,246,0.25)':'transparent',
                      color:panelNeighborTab===t?'#c4b5fd':'rgba(255,255,255,0.35)' }}>
                    {t==='from-node'?'From Node':'Raw Vector'}
                  </button>
                ))}
              </div>

              {panelNeighborTab==='from-node' && (
                <>
                  <div style={{ fontSize:'12px',color:'rgba(255,255,255,0.45)' }}>
                    {selectedNode?`Source: ${selectedNode.label}`:'Select a node first'}
                  </div>
                  <button onClick={() => void handleFindNeighborsFromNode()} disabled={!selectedNodeId||nodeQueryLoading}
                    style={{ padding:'7px',borderRadius:'8px',border:'1px solid rgba(139,92,246,0.3)',background:'rgba(139,92,246,0.1)',color:'#c4b5fd',fontSize:'11px',cursor:'pointer',fontFamily:'inherit',opacity:!selectedNodeId?0.4:1 }}>
                    {nodeQueryLoading?'Loading…':'Find Neighbors'}
                  </button>
                  {fromNodeError && <div style={{ color:'#f87171',fontSize:'11px' }}>{fromNodeError}</div>}
                  {fromNodeNeighbors.map((r,i) => (
                    <div key={i} style={{ padding:'8px',borderRadius:'8px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',fontSize:'11px',color:'rgba(255,255,255,0.55)' }}>
                      <div style={{ color:'white',fontWeight:600,marginBottom:'2px' }}>{r.label ?? r.id}</div>
                      <div style={{ color:'rgba(255,255,255,0.35)' }}>dist: {typeof r.distance==='number'?r.distance.toFixed(3):'—'}</div>
                    </div>
                  ))}
                </>
              )}

              {panelNeighborTab==='embedding' && (
                <>
                  <textarea value={embeddingJson} onChange={e=>setEmbeddingJson(e.target.value)}
                    placeholder="[0.01, -0.02, ...]" rows={3}
                    style={{ width:'100%',padding:'8px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.65)',fontSize:'10px',resize:'none',fontFamily:"'JetBrains Mono',monospace",boxSizing:'border-box' }} />
                  <div style={{ display:'flex',gap:'6px' }}>
                    <label style={{ flex:1,fontSize:'10px',color:'rgba(255,255,255,0.35)',display:'flex',flexDirection:'column',gap:'3px' }}>
                      k<input type="number" min={1} max={100} value={embeddingMatchCount} onChange={e=>setEmbeddingMatchCount(+e.target.value)}
                        style={{ padding:'5px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.65)',fontSize:'11px',fontFamily:'inherit' }} />
                    </label>
                    <label style={{ flex:1,fontSize:'10px',color:'rgba(255,255,255,0.35)',display:'flex',flexDirection:'column',gap:'3px' }}>
                      max dist<input type="number" step={0.01} value={embeddingMaxDistance} onChange={e=>setEmbeddingMaxDistance(+e.target.value)}
                        style={{ padding:'5px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.65)',fontSize:'11px',fontFamily:'inherit' }} />
                    </label>
                  </div>
                  <button onClick={() => void handleEmbeddingQuery()} disabled={embeddingQueryLoading||!embeddingJson.trim()}
                    style={{ padding:'7px',borderRadius:'8px',border:'1px solid rgba(139,92,246,0.3)',background:'rgba(139,92,246,0.1)',color:'#c4b5fd',fontSize:'11px',cursor:'pointer',fontFamily:'inherit' }}>
                    {embeddingQueryLoading?'Loading…':'Search'}
                  </button>
                  {embeddingError && <div style={{ color:'#f87171',fontSize:'11px' }}>{embeddingError}</div>}
                  {embeddingNeighbors.map((r,i) => (
                    <div key={i} style={{ padding:'8px',borderRadius:'8px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',fontSize:'11px',color:'rgba(255,255,255,0.55)' }}>
                      <div style={{ color:'white',fontWeight:600,marginBottom:'2px' }}>{r.label??r.id}</div>
                      <div style={{ color:'rgba(255,255,255,0.35)' }}>dist: {typeof r.distance==='number'?r.distance.toFixed(3):'—'}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* UPLOAD TAB */}
          {panelTab==='upload' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
              <div style={{ fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#fbbf24' }}>Upload Document</div>
              <p style={{ fontSize:'11px',color:'rgba(255,255,255,0.35)',lineHeight:1.6,margin:0 }}>
                Upload a PDF, image, or Office file to process into the graph.
              </p>
              <label style={{ display:'block',padding:'20px',borderRadius:'12px',border:'2px dashed rgba(255,255,255,0.12)',textAlign:'center',cursor:'pointer',transition:'all 0.2s',color:'rgba(255,255,255,0.35)',fontSize:'12px' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(251,191,36,0.4)';e.currentTarget.style.color='#fbbf24';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.12)';e.currentTarget.style.color='rgba(255,255,255,0.35)';}}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx,.xlsx,.md,.txt" style={{ display:'none' }}
                  onChange={e => setUploadFile(e.target.files?.[0]||null)} />
                <div style={{ fontSize:'1.5rem',marginBottom:'6px' }}>📄</div>
                {uploadFile ? uploadFile.name : 'Click to select file'}
              </label>
              <button onClick={() => void handleUpload()} disabled={!uploadFile||uploading}
                style={{ padding:'9px',borderRadius:'10px',border:'none',background: uploading?'rgba(251,191,36,0.2)':'linear-gradient(135deg,#fbbf24,#f59e0b)',color: uploading?'#fbbf24':'#000000',fontWeight:700,fontSize:'12px',cursor:'pointer',fontFamily:'inherit',opacity:!uploadFile?0.4:1 }}>
                {uploading?'Uploading…':'Upload & Process'}
              </button>
              {uploadStatus && (
                <div style={{ fontSize:'11px',padding:'8px',borderRadius:'8px',background: uploadStatus.startsWith('✓')?'rgba(232,255,90,0.08)':'rgba(248,113,113,0.08)',color: uploadStatus.startsWith('✓')?'#e8ff5a':'#f87171',border:`1px solid ${uploadStatus.startsWith('✓')?'rgba(232,255,90,0.2)':'rgba(248,113,113,0.2)'}` }}>
                  {uploadStatus}
                </div>
              )}
            </div>
          )}

          {/* FILTERS TAB */}
          {panelTab==='filters' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
              <div style={{ fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#f472b6' }}>Node Type Filters</div>
              <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                {Object.entries(nodeFilters).map(([type, isVisible]) => (
                  <label key={type} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                      <span style={{ width:'8px',height:'8px',borderRadius:'50%',background:entityTypeColors[type]||'rgba(255,255,255,0.65)',boxShadow:isVisible?`0 0 8px ${entityTypeColors[type]||'rgba(255,255,255,0.65)'}`:'none' }} />
                      <span style={{ fontSize:'12px',color:isVisible?'white':'rgba(255,255,255,0.35)',textTransform:'capitalize',transition:'color 0.2s' }}>{type} nodes</span>
                    </div>
                    <input type="checkbox" checked={isVisible} onChange={() => toggleNodeFilter(type)}
                      style={{ width:'14px',height:'14px',accentColor: entityTypeColors[type]||'#e8ff5a',cursor:'pointer' }} />
                  </label>
                ))}
              </div>
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'10px' }}>
                <div style={{ fontSize:'10px',color:'rgba(255,255,255,0.3)',marginBottom:'8px',letterSpacing:'0.1em',textTransform:'uppercase' }}>Graph Stats</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px' }}>
                  {[
                    { label:'Total Nodes', val: nodes.length },
                    { label:'Types', val: [...new Set(nodes.map(n=>n.entity_type||'text'))].length },
                  ].map(s => (
                    <div key={s.label} style={{ padding:'8px',borderRadius:'8px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',textAlign:'center' }}>
                      <div style={{ fontSize:'1.2rem',fontWeight:700,color:'white',lineHeight:1 }}>{s.val}</div>
                      <div style={{ fontSize:'10px',color:'rgba(255,255,255,0.3)',marginTop:'3px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── HELP OVERLAY ── */}
      {helpOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(5,9,20,0.85)',backdropFilter:'blur(12px)' }}>
          <div style={{ background:'rgba(10,15,30,0.98)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'20px',padding:'2rem',maxWidth:'400px',width:'90%' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem' }}>
              <h2 style={{ fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.2rem',color:'white',margin:0 }}>Graph Controls</h2>
              <button onClick={() => setHelpOpen(false)} style={{ padding:'6px 12px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.65)',cursor:'pointer',fontFamily:'inherit',fontSize:'12px' }}>
                Close
              </button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
              {[
                ['🖱️ Drag', 'Orbit the camera'],
                ['🔍 Scroll', 'Zoom in/out'],
                ['🖱️ Click node', 'Select & inspect node'],
                ['✊ Fist gesture', 'Toggle heatmap (webcam)'],
                ['👆 Point', 'Hover node (webcam)'],
                ['🤏 Pinch', 'Select node (webcam)'],
                ['🤲 Two hands', 'Zoom (webcam)'],
              ].map(([icon, desc]) => (
                <div key={icon} style={{ display:'flex',gap:'12px',alignItems:'center',fontSize:'13px' }}>
                  <span style={{ width:'28px',textAlign:'center',flexShrink:0 }}>{icon}</span>
                  <span style={{ color:'rgba(255,255,255,0.55)' }}>{desc}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setHelpOpen(false)}
              style={{ marginTop:'1.5rem',width:'100%',padding:'10px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#e8ff5a,#4af0ff)',color:'#000000',fontWeight:700,fontSize:'13px',cursor:'pointer',fontFamily:'inherit' }}>
              Enter Graph
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <div className="absolute right-4 z-30" style={{ top:'72px',background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:'10px',padding:'8px 12px',fontSize:'11px',color:'#f87171',maxWidth:'280px' }}>
          {saveError}
        </div>
      )}
    </div>
  );
}
