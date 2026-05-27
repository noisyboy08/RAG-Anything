import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MarketingShell } from '../components/marketing/MarketingShell';
import { FadeDiv } from '../components/ui/FadeDiv';

/* ─── Animated counter ─── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = () => {
        start += to / 60;
        if (start >= to) { setVal(to); return; }
        setVal(Math.floor(start));
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return <div ref={ref}>{val}{suffix}</div>;
}

/* ─── Rotating word ─── */
const WORDS = ['PDFs', 'Images', 'Tables', 'Equations', 'Everything'];
function RotatingWord() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setI(n => (n + 1) % WORDS.length); setVisible(true); }, 350);
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{
      display: 'inline-block',
      color: '#e8ff5a',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
    }}>
      {WORDS[i]}
    </span>
  );
}

/* ─── Floating orb background ─── */
function FloatingOrbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* big ambient blobs */}
      <div style={{ position:'absolute', top:'-15%', left:'60%', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(232,255,90,0.06) 0%, transparent 65%)', filter:'blur(60px)' }} />
      <div style={{ position:'absolute', bottom:'-10%', left:'5%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(68,136,255,0.08) 0%, transparent 65%)', filter:'blur(80px)' }} />
      <div style={{ position:'absolute', top:'30%', right:'5%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,90,200,0.06) 0%, transparent 65%)', filter:'blur(60px)' }} />

      {/* grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }} />

      {/* subtle dots at grid intersections via radial */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }} />
    </div>
  );
}

const features = [
  {icon:'📄', title:'PDF & Document Parsing', detail:'MinerU extracts text, tables, figures, and equations from any PDF preserving layout and reading order. PaddleOCR handles scanned documents across 80+ languages.', tag:'Parser'},
  {icon:'🧩', title:'Modal Content Enrichment', detail:'Images get LLM captions. Tables become structured summaries. Equations are translated to natural language. Each processor uses your LLM with surrounding page context.', tag:'Processor'},
  {icon:'🕸️', title:'Graph-Grounded Retrieval', detail:'LightRAG builds a knowledge graph from extracted entities and relations. At query time, graph traversal + vector search delivers far richer context than plain RAG.', tag:'Retrieval'},
  {icon:'⚡', title:'Batch & Delta Indexing', detail:'Process entire directories with async parallel workers. IndexManifest tracks SHA-256 hashes so unchanged files are automatically skipped on re-runs.', tag:'Scale'},
  {icon:'🔗', title:'Cross-Encoder Reranking', detail:'ms-marco-MiniLM reranks retrieved passages before the LLM call, cutting hallucinations and improving answer accuracy for complex documents.', tag:'Accuracy'},
  {icon:'🖼️', title:'CLIP Multimodal Embeddings', detail:'Jina CLIP or similar models embed images and text in a shared vector space — enabling joint similarity search across modalities.', tag:'Embeddings'},
];

const queryModes = [
  {mode:'local',  color:'#e8ff5a', desc:'Entity-level search. Fast, node-centric answers.'},
  {mode:'global', color:'#4af0ff', desc:'Community-level context. Broader topic summaries.'},
  {mode:'hybrid', color:'#a78bfa', desc:'Balanced local + global. Good all-round.'},
  {mode:'naive',  color:'#f472b6', desc:'Direct chunk retrieval. Fastest, no graph.'},
  {mode:'mix',    color:'#e8ff5a', desc:'Best of local + global. Recommended default.'},
];

const quickCode = `pip install -e ".[all]"`;
const queryCode = `await rag.aquery("Your question", mode="mix")`;

export function LandingPage() {
  const [copied, setCopied] = useState<string|null>(null);
  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <MarketingShell active="home" description="RAG-Anything: build production RAG over PDFs, images, tables, and equations with LightRAG graph-grounded retrieval.">

      {/* ══════════════════════════════════════════════════════════
          HERO — full-width cinematic
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#000',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}>
        <FloatingOrbs />

        {/* Status badge */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: '2.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 18px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e8ff5a', boxShadow: '0 0 10px #e8ff5a', animation: 'heroPing 1.8s ease-out infinite' }} />
            Open Source · Python ≥ 3.10 · MIT Licensed
          </span>
        </div>

        {/* Big headline */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1100px', padding: '0 2rem' }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', system-ui",
            fontWeight: 700,
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            lineHeight: 1.0,
            letterSpacing: '-0.04em',
            color: 'white',
            margin: '0 0 0.4rem',
          }}>
            Build RAG over
          </h1>
          <h1 style={{
            fontFamily: "'Space Grotesk', system-ui",
            fontWeight: 700,
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            lineHeight: 1.0,
            letterSpacing: '-0.04em',
            margin: '0 0 2.5rem',
          }}>
            <RotatingWord />
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '620px',
            margin: '0 auto 3rem',
            fontWeight: 400,
          }}>
            RAG-Anything parses complex multimodal documents — PDFs, images, tables, equations —
            and indexes them into LightRAG for graph-grounded retrieval that actually understands your content.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link to="/docs"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '10px', background: '#e8ff5a', color: '#000', fontWeight: 700, fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s', letterSpacing: '-0.01em' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#d4eb47'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#e8ff5a'; e.currentTarget.style.transform = ''; }}>
              Get started →
            </Link>
            <a href="https://github.com/noisyboy08/RAG-Anything" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '15px', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.transform = ''; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              View on GitHub
            </a>
          </div>

          {/* Install pill */}
          <div
            style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '11px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'border-color 0.2s' }}
            onClick={() => void copy(quickCode, 'install')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.22)' }}>$</span>
            <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{quickCode}</code>
            <span style={{ padding: '3px 8px', borderRadius: '6px', background: copied === 'install' ? 'rgba(232,255,90,0.15)' : 'rgba(255,255,255,0.05)', color: copied === 'install' ? '#e8ff5a' : 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', transition: 'all 0.2s' }}>
              {copied === 'install' ? 'COPIED' : 'COPY'}
            </span>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Scroll</span>
          <div style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)', animation: 'scrollPulse 2s ease-in-out infinite' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '3.5rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }} className="stats-grid">
          {[
            { val: 80, suffix: '+', label: 'OCR Languages' },
            { val: 5,  suffix: '',  label: 'Query Modes' },
            { val: 6,  suffix: '',  label: 'Modality Types' },
            { val: 3,  suffix: ' parsers', label: 'Supported' },
          ].map((s, i) => (
            <FadeDiv key={i} delay={i * 80}>
              <div style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: '2.5rem', color: 'white', letterSpacing: '-0.04em', lineHeight: 1 }}>
                <Counter to={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
            </FadeDiv>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ONE PIPELINE SECTION
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: '7rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeDiv>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 1.5rem' }}>The Framework</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: 'clamp(2rem,4vw,3.5rem)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white', margin: '0 0 1.5rem', maxWidth: '700px' }}>
              One pipeline, every layer of your documents.
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.4)', maxWidth: '560px', margin: '0 0 3.5rem' }}>
              Most RAG systems process only plain text. RAG-Anything handles images, tables, equations, and scanned pages — all in one normalized pipeline.
            </p>
          </FadeDiv>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { step: '01', title: 'Ingest',     detail: 'PDF · DOCX · PPTX · Images · Markdown' },
              { step: '02', title: 'Parse',      detail: 'MinerU · PaddleOCR · Text converter' },
              { step: '03', title: 'Normalize',  detail: 'Unified content list with page + type' },
              { step: '04', title: 'Enrich',     detail: 'LLM captions, summaries, explanations' },
              { step: '05', title: 'Index',      detail: 'LightRAG graph + vector + KV storage' },
              { step: '06', title: 'Retrieve',   detail: 'Graph-grounded, context-rich answers' },
            ].map((s, i) => (
              <FadeDiv key={i} delay={i * 60}>
                <div style={{ padding: '2rem 1.5rem', background: '#0c0c0c', height: '100%', transition: 'background 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#131313'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0c0c0c'}>
                  <div style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: '2.5rem', color: 'rgba(255,255,255,0.07)', lineHeight: 1, marginBottom: '1rem' }}>{s.step}</div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'white', marginBottom: '0.5rem' }}>{s.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{s.detail}</div>
                </div>
              </FadeDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BUILT FOR MAKERS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: '7rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }} className="hero-grid">
          <FadeDiv>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 1.5rem' }}>Open Source</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: 'clamp(2rem,3.5vw,3rem)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white', margin: '0 0 1.5rem' }}>
              Built for teams who ship.
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.4)', margin: '0 0 2.5rem' }}>
              RAG-Anything is a Python library first — typed, async, composable, and production-hardened. Drop it into any LLM stack without vendor lock-in.
            </p>
            <div style={{ display: 'flex', gap: '2.5rem' }}>
              {[['MIT', 'Licensed'], ['Python', '3.10+'], ['Async', 'First'], ['Type', 'Safe']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: '1.4rem', color: 'white', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', letterSpacing: '0.05em' }}>{l}</div>
                </div>
              ))}
            </div>
          </FadeDiv>
          <FadeDiv delay={150}>
            <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginLeft: '6px' }}>quickstart.py</span>
              </div>
              <pre style={{ margin: 0, padding: '1.5rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px', lineHeight: 1.9, color: 'rgba(255,255,255,0.65)', overflowX: 'auto' }}>
                <code dangerouslySetInnerHTML={{ __html: `<span style="color:rgba(255,255,255,0.3)"># 1. Configure</span>
config = RAGAnythingConfig(
  working_dir=<span style="color:#e8ff5a">"./storage"</span>,
  parser=<span style="color:#e8ff5a">"mineru"</span>,
  enable_image_processing=<span style="color:#4af0ff">True</span>,
  enable_cross_encoder=<span style="color:#4af0ff">True</span>,
)

<span style="color:rgba(255,255,255,0.3)"># 2. Process</span>
<span style="color:#a78bfa">await</span> rag.process_document_complete(
  <span style="color:#e8ff5a">"report.pdf"</span>
)

<span style="color:rgba(255,255,255,0.3)"># 3. Query</span>
answer = <span style="color:#a78bfa">await</span> rag.aquery(
  <span style="color:#e8ff5a">"Summarize the key findings"</span>,
  mode=<span style="color:#e8ff5a">"mix"</span>,
)` }} />
              </pre>
            </div>
          </FadeDiv>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: '7rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', alignItems: 'start' }} className="hero-grid">
            <FadeDiv>
              <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 1.5rem' }}>Features</p>
              <h2 style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: 'clamp(1.8rem,3vw,2.5rem)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white', margin: '0 0 1.5rem' }}>
                We build tools for structured thinking.
              </h2>
              <p style={{ fontSize: '13.5px', lineHeight: 1.8, color: 'rgba(255,255,255,0.35)', margin: '0 0 2rem' }}>
                Every capability is designed around one principle: keep meaning intact from page to answer.
              </p>
              <Link to="/features" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                All features <span>→</span>
              </Link>
            </FadeDiv>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              {features.map((f, i) => (
                <FadeDiv key={i} delay={i * 50}>
                  <div style={{ padding: '1.75rem', background: '#0c0c0c', height: '100%', transition: 'background 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#131313'}
                    onMouseLeave={e => e.currentTarget.style.background = '#0c0c0c'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{f.tag}</span>
                    </div>
                    <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'white', margin: '0 0 0.5rem', lineHeight: 1.3 }}>{f.title}</h3>
                    <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, margin: 0 }}>{f.detail}</p>
                  </div>
                </FadeDiv>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          QUERY MODES
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: '7rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeDiv style={{ marginBottom: '4rem' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 1.5rem' }}>Retrieval</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: 'clamp(2rem,3.5vw,3rem)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white', margin: '0 0 1rem' }}>
              Where graph thinking wins.
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.4)', maxWidth: '520px', margin: 0 }}>
              Choose from 5 query modes. <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#e8ff5a', background: 'rgba(232,255,90,0.1)', padding: '2px 6px', borderRadius: '4px' }}>mix</code> combines local entity search with global community summaries for the best results.
            </p>
          </FadeDiv>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {queryModes.map((m, i) => (
              <FadeDiv key={i} delay={i * 60}>
                <div style={{ padding: '2rem 1.5rem', background: '#0c0c0c', height: '100%', transition: 'background 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#131313'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0c0c0c'}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color, boxShadow: `0 0 10px ${m.color}`, marginBottom: '1.25rem' }} />
                  <div style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: '1.1rem', color: 'white', marginBottom: '0.5rem' }}>{m.mode}</div>
                  <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.65 }}>{m.desc}</div>
                </div>
              </FadeDiv>
            ))}
          </div>

          <FadeDiv delay={200} style={{ marginTop: '2rem' }}>
            <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{queryCode}</code>
              <button onClick={() => void copy(queryCode, 'query')} style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: copied === 'query' ? '#e8ff5a' : 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', letterSpacing: '0.05em' }}>
                {copied === 'query' ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </FadeDiv>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: '7rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeDiv style={{ marginBottom: '4rem', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 1.5rem' }}>Deployment</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: 'clamp(2rem,4vw,3.5rem)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white', margin: '0 0 1rem' }}>
              Start free, scale when ready.
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto' }}>
              MIT licensed at the core. Bring your own models, storage, and infrastructure. No managed lock-in.
            </p>
          </FadeDiv>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }} className="pricing-grid">
            {[
              { plan: 'Self-Hosted', price: 'Free',   sub: 'Forever',      color: '#4af0ff', features: ['MIT licensed','All parsers','All modal processors','Delta indexing','Local / offline','Community support'] },
              { plan: 'Cloud',       price: 'Scale',  sub: 'Usage-based',  color: '#e8ff5a', badge: 'Most popular', features: ['Everything in Self-Hosted','Managed API endpoints','Auto-scaling workers','Observability + tracing','Multi-user auth','Priority support'] },
              { plan: 'Enterprise',  price: 'Custom', sub: 'Contact us',   color: '#a78bfa', features: ['Everything in Cloud','Air-gapped deployment','SSO / SAML','Compliance & audit logs','Dedicated engineer','99.9% SLA'] },
            ].map((p, i) => (
              <FadeDiv key={i} delay={i * 80}>
                <div style={{ padding: '2.5rem 2rem', background: '#0c0c0c', height: '100%', position: 'relative' }}>
                  {p.badge && <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', padding: '3px 10px', borderRadius: '9999px', background: 'rgba(232,255,90,0.12)', color: '#e8ff5a', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.badge}</div>}
                  <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>{p.plan}</div>
                  <div style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: '2.2rem', color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{p.price}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '2rem' }}>{p.sub}</div>
                  <ul style={{ listStyle: 'none', margin: '0 0 2.5rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {p.features.map(f => <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      <span style={{ color: p.color, flexShrink: 0, marginTop: '2px' }}>✓</span>{f}
                    </li>)}
                  </ul>
                  <Link to={p.plan === 'Enterprise' ? '/contact' : '/docs'} style={{ display: 'block', textAlign: 'center', padding: '11px 20px', borderRadius: '9px', border: `1px solid ${p.color}30`, background: `${p.color}08`, color: p.color, fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${p.color}15`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${p.color}08`; }}>
                    {p.plan === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </Link>
                </div>
              </FadeDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: '7rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <FadeDiv style={{ marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 1.5rem' }}>FAQ</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: 'clamp(2rem,3.5vw,3rem)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white', margin: 0 }}>Common questions</h2>
          </FadeDiv>
          {[
            { q: 'What LLMs can I use?', a: 'Any LLM you can wrap in a function matching the lightrag call signature. OpenAI, Anthropic, Gemini, local Ollama — all work.' },
            { q: 'Does it work offline?', a: 'Yes. Use local models via Ollama, cache tiktoken offline, and point storage to local paths. No internet required after initial setup.' },
            { q: 'How much does it cost to run?', a: 'Parsing is compute cost. LLM calls happen for modal processors (captioning, summarizing) and entity extraction — roughly 2–5 calls per page for complex documents.' },
            { q: 'Can I use my own embedding model?', a: 'Yes. Provide any embedding function. Common choices: OpenAI text-embedding-3-small, sentence-transformers, or Jina CLIP for multimodal.' },
            { q: 'Is it production ready?', a: 'Yes. Pydantic schema validation, async concurrency controls, delta indexing, error handling with graceful fallbacks, and type-safe configuration throughout.' },
          ].map((faq, i) => (
            <FadeDiv key={i} delay={i * 60}>
              <div style={{ padding: '1.5rem 0', borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: 600, marginTop: '1px', flexShrink: 0 }}>↳</span>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 0.5rem' }}>{faq.q}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', lineHeight: 1.75, margin: 0 }}>{faq.a}</p>
                  </div>
                </div>
              </div>
            </FadeDiv>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080808', padding: '8rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <FadeDiv>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 2rem' }}>Open Source</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: 'clamp(2.5rem,5vw,4.5rem)', lineHeight: 1.0, letterSpacing: '-0.04em', color: 'white', margin: '0 0 2rem' }}>
              Ready to map your<br />knowledge graph?
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.35)', maxWidth: '460px', margin: '0 auto 3rem' }}>
              Install RAG-Anything, point it at your documents, and have answers in minutes.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '10px', background: '#e8ff5a', color: '#000', fontWeight: 700, fontSize: '14px', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#d4eb47'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e8ff5a'; e.currentTarget.style.transform = ''; }}>
                Start for free
              </Link>
              <Link to="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '14px', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
                Try Graph App
              </Link>
            </div>
          </FadeDiv>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TYPOGRAPHIC FOOTER HERO
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#050505', padding: '6rem 2rem 3rem', overflow: 'hidden', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <FadeDiv>
            <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', margin: '0 0 1rem' }}>Multimodal RAG Framework</p>
          </FadeDiv>
          <div style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 700, fontSize: 'clamp(4rem,12vw,11rem)', lineHeight: 0.88, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.06)', userSelect: 'none', marginBottom: '2rem', pointerEvents: 'none', overflow: 'hidden' }}>
            RAG<br />ANYTHING<br />GRAPH.
          </div>
          <div style={{ position: 'absolute', bottom: '3rem', right: '2rem', textAlign: 'right' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginBottom: '8px', letterSpacing: '0.1em' }}>noisyboy08 / RAG-Anything</div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              {[['https://github.com/noisyboy08/RAG-Anything', 'GitHub', true], ['/docs', 'Docs', false], ['/contact', 'Contact', false]].map(([href, label, ext]) => (
                ext
                  ? <a key={String(label)} href={String(href)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>{label}</a>
                  : <Link key={String(label)} to={String(href)} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes heroPing { 0% { box-shadow: 0 0 0 0 rgba(232,255,90,0.7); } 70% { box-shadow: 0 0 0 8px rgba(232,255,90,0); } 100% { box-shadow: 0 0 0 0 rgba(232,255,90,0); } }
        @keyframes scrollPulse { 0%,100% { opacity: 0.2; } 50% { opacity: 0.7; } }
        @media(max-width:768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </MarketingShell>
  );
}
