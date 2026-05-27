import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MarketingShell } from '../../components/marketing/MarketingShell';
import { FadeDiv } from '../../components/ui/FadeDiv';

const sections = [
  {id:'install',label:'Installation'},
  {id:'config',label:'Configuration'},
  {id:'process',label:'Processing'},
  {id:'query',label:'Querying'},
  {id:'batch',label:'Batch Mode'},
  {id:'api',label:'API Reference'},
];

const apiRows = [
  {method:'process_document_complete',sig:'async (file_path, output_dir?, parse_method?) → None',desc:'Full pipeline: parse → enrich → insert into LightRAG.'},
  {method:'aquery',sig:'async (query, mode="mix", **kwargs) → str',desc:'Text query over the knowledge graph. Modes: local, global, hybrid, naive, mix.'},
  {method:'aquery_with_multimodal',sig:'async (query, multimodal_content, mode) → str',desc:'Query combining text + multimodal content items (images, tables, equations).'},
  {method:'initialize_lightrag',sig:'async () → dict',desc:'Initialize LightRAG, parse cache, and modal processors.'},
  {method:'finalize_storages',sig:'async () → None',desc:'Flush and close all LightRAG storages. Call on shutdown.'},
  {method:'process_batch',sig:'(file_paths, output_dir, recursive, dry_run) → BatchProcessingResult',desc:'Sync batch processing with delta tracking via IndexManifest.'},
  {method:'process_batch_async',sig:'async (...) → BatchProcessingResult',desc:'Async batch processing with asyncio.Semaphore and asyncio.to_thread.'},
];

function hl(code: string) {
  return code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(#.*$)/gm,'<span style="color:rgba(255,255,255,0.35);font-style:italic">$1</span>')
    .replace(/\b(from|import|await|async|True|False|None|print|def|class|return)\b/g,'<span style="color:#c084fc">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g,'<span style="color:#86efac">$1</span>');
}

function CodePane({code,file,onCopy,copied}:{code:string;file:string;onCopy:(k:string)=>void;copied:string|null}){
  return (
    <div style={{background:'#080808',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.08)',overflow:'hidden',marginTop:'1rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>{file}</span>
        <button onClick={()=>onCopy(file)} style={{padding:'4px 12px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.1)',background:copied===file?'rgba(232,255,90,0.15)':'rgba(255,255,255,0.04)',color:copied===file?'#e8ff5a':'rgba(255,255,255,0.35)',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>
          {copied===file?'✓ Copied':'Copy'}
        </button>
      </div>
      <pre style={{margin:0,padding:'1.25rem 1.5rem',fontFamily:"'JetBrains Mono',monospace",fontSize:'12.5px',lineHeight:1.8,color:'rgba(255,255,255,0.65)',overflowX:'auto'}}>
        <code dangerouslySetInnerHTML={{__html:hl(code)}} />
      </pre>
    </div>
  );
}

const configCode = `from raganything import RAGAnythingConfig

config = RAGAnythingConfig(
    working_dir="./rag_storage",       # LightRAG storage path
    parser="mineru",                   # "mineru" | "paddleocr"
    parse_method="auto",               # "auto" | "txt" | "ocr"
    enable_image_processing=True,
    enable_table_processing=True,
    enable_equation_processing=True,
    context_window=1,                  # pages of surrounding context
    max_concurrent_files=1,
    enable_cross_encoder=False,
    cross_encoder_model="cross-encoder/ms-marco-MiniLM-L-6-v2",
    enable_multimodal_embedding=False,
    multimodal_embedding_model="jinaai/jina-clip-v1",
)`;

const processCode = `import asyncio
from raganything import RAGAnything, RAGAnythingConfig
from lightrag.llm.openai import openai_complete_if_cache, openai_embed

config = RAGAnythingConfig(working_dir="./rag_storage")
rag = RAGAnything(
    config=config,
    llm_model_func=lambda *a,**k: openai_complete_if_cache("gpt-4o-mini",*a,**k),
    embedding_func=lambda *a,**k: openai_embed(*a,**k),
)

async def main():
    await rag.initialize_lightrag()
    await rag.process_document_complete("my_document.pdf")
    await rag.finalize_storages()

asyncio.run(main())`;

const queryCode = `# Text query
answer = await rag.aquery("What are the main contributions?", mode="mix")

# Multimodal
result = await rag.aquery_with_multimodal(
    "Analyze this figure",
    multimodal_content=[{"type":"image","img_path":"fig1.png"}],
)

# Modes: local | global | hybrid | naive | mix`;

const batchCode = `from raganything import BatchParser

batch = BatchParser(parser_type="mineru", max_workers=4, show_progress=True)

# Delta indexing: unchanged files auto-skipped
result = batch.process_batch(
    file_paths=["./documents/"],
    output_dir="./output",
    recursive=True,
    dry_run=False,
)
print(result.summary())

# Async variant:
result = await batch.process_batch_async(file_paths=["./docs/"], output_dir="./output")`;

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('install');
  const [copied, setCopied] = useState<string|null>(null);

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(()=>setCopied(null),2000);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <MarketingShell active="docs" title="Documentation" description="RAG-Anything docs: installation, configuration, processing, querying, batch workflows, and API reference.">
      <div style={{maxWidth:'1280px',margin:'0 auto',display:'grid',gridTemplateColumns:'220px 1fr',gap:'3rem',padding:'3rem 2rem 6rem',minHeight:'calc(100vh - 64px)'}} className="docs-grid">
        <nav style={{position:'sticky',top:'84px',height:'fit-content'}}>
          <p style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',margin:'0 0 0.75rem'}}>On this page</p>
          <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'4px'}}>
            {sections.map(s=>(
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={()=>setActiveSection(s.id)} style={{display:'block',padding:'8px 12px',borderRadius:'8px',fontSize:'13.5px',textDecoration:'none',transition:'all 0.2s',
                  background:activeSection===s.id?'rgba(232,255,90,0.08)':'transparent',
                  color:activeSection===s.id?'#e8ff5a':'rgba(255,255,255,0.5)',
                  borderLeft:activeSection===s.id?'2px solid #e8ff5a':'2px solid transparent'}}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main>
          <FadeDiv id="install" style={{marginBottom:'4rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.8rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Installation</h2>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:'14.5px',lineHeight:1.8,margin:'0 0 1.5rem'}}>RAG-Anything requires Python 3.10+. Install in editable mode to get all optional dependencies.</p>
            {[
              {cmd:'git clone https://github.com/noisyboy08/RAG-Anything.git',label:'Clone repository'},
              {cmd:'python -m venv .venv',label:'Create virtual environment'},
              {cmd:'.venv\\Scripts\\activate  # Windows\nsource .venv/bin/activate  # Unix',label:'Activate venv'},
              {cmd:'pip install -e ".[all]"',label:'Install with all extras'},
            ].map(({cmd,label})=>(
              <div key={label} style={{background:'#080808',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.08)',overflow:'hidden',marginBottom:'10px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>{label}</span>
                  <button onClick={()=>void copy(label,cmd)} style={{padding:'4px 10px',borderRadius:'6px',border:'1px solid rgba(255,255,255,0.1)',background:copied===label?'rgba(232,255,90,0.15)':'rgba(255,255,255,0.04)',color:copied===label?'#e8ff5a':'rgba(255,255,255,0.4)',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>
                    {copied===label?'✓':'Copy'}
                  </button>
                </div>
                <pre style={{margin:0,padding:'12px 16px',fontFamily:"'JetBrains Mono',monospace",fontSize:'13px',lineHeight:1.7,color:'#e8ff5a'}}><code>{cmd}</code></pre>
              </div>
            ))}
            <div style={{marginTop:'1.5rem',padding:'1rem 1.25rem',borderRadius:'10px',background:'rgba(251,191,36,0.06)',border:'1px solid rgba(251,191,36,0.2)'}}>
              <p style={{color:'#fbbf24',fontSize:'13px',margin:0}}><strong>Note:</strong> MinerU downloads models on first run. Set <code style={{fontFamily:"'JetBrains Mono',monospace"}}>MINERU_DEVICE=cpu</code> for CPU-only environments.</p>
            </div>
          </FadeDiv>

          <FadeDiv id="config" style={{marginBottom:'4rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.8rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Configuration Reference</h2>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:'14.5px',lineHeight:1.8,margin:'0 0 0.5rem'}}>All config values can also be set via environment variables in uppercase.</p>
            <CodePane code={configCode} file="config_reference.py" onCopy={(k)=>void copy(k,configCode)} copied={copied} />
          </FadeDiv>

          <FadeDiv id="process" style={{marginBottom:'4rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.8rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Processing Documents</h2>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:'14.5px',lineHeight:1.8,margin:'0 0 0.5rem'}}>Use <code style={{fontFamily:"'JetBrains Mono',monospace",background:'rgba(255,255,255,0.06)',padding:'2px 6px',borderRadius:'4px'}}>process_document_complete</code> for full end-to-end ingestion.</p>
            <CodePane code={processCode} file="process_example.py" onCopy={(k)=>void copy(k,processCode)} copied={copied} />
          </FadeDiv>

          <FadeDiv id="query" style={{marginBottom:'4rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.8rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Querying</h2>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:'14.5px',lineHeight:1.8,margin:'0 0 0.5rem'}}>5 query modes. <code style={{fontFamily:"'JetBrains Mono',monospace",background:'rgba(255,255,255,0.06)',padding:'2px 6px',borderRadius:'4px'}}>mix</code> is recommended for most use cases.</p>
            <CodePane code={queryCode} file="query_example.py" onCopy={(k)=>void copy(k,queryCode)} copied={copied} />
          </FadeDiv>

          <FadeDiv id="batch" style={{marginBottom:'4rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.8rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Batch Mode</h2>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:'14.5px',lineHeight:1.8,margin:'0 0 0.5rem'}}>Process entire directories automatically. Unchanged files are skipped via manifest hashing.</p>
            <CodePane code={batchCode} file="batch_example.py" onCopy={(k)=>void copy(k,batchCode)} copied={copied} />
          </FadeDiv>

          <FadeDiv id="api" style={{marginBottom:'4rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.8rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>API Reference</h2>
            <div style={{background:'#080808',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',overflow:'hidden',marginTop:'1.5rem'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13.5px'}}>
                <thead>
                  <tr style={{background:'rgba(255,255,255,0.03)',textAlign:'left'}}>
                    <th style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)',fontWeight:600}}>Method</th>
                    <th style={{padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)',fontWeight:600}}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['process_document_complete(path)', 'Full pipeline: parse, enrich, index. Yields progress.'],
                    ['aquery(query, mode="mix")', 'Retrieve and answer via graph + vector.'],
                    ['aquery_with_multimodal(query, list)', 'Query including explicit image inputs.'],
                    ['initialize_lightrag()', 'Setup storage, workers, and index mapping.'],
                    ['finalize_storages()', 'Flush state to disk/db.'],
                  ].map(([m,d],i)=>(
                    <tr key={i} style={{borderBottom:i===4?'none':'1px solid rgba(255,255,255,0.04)'}}>
                      <td style={{padding:'12px 16px',color:'#e8ff5a',fontFamily:"'JetBrains Mono',monospace",fontSize:'12.5px'}}>{m}</td>
                      <td style={{padding:'12px 16px',color:'rgba(255,255,255,0.6)'}}>{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeDiv>

          <FadeDiv style={{marginTop:'3rem',padding:'1.5rem',borderRadius:'14px',background:'rgba(232,255,90,0.04)',border:'1px solid rgba(232,255,90,0.15)'}}>
            <p style={{color:'rgba(232,255,90,0.8)',fontSize:'14px',lineHeight:1.7,margin:0}}>
              Need a full example? See <a href="https://github.com/noisyboy08/RAG-Anything/tree/main/examples" target="_blank" rel="noopener noreferrer" style={{color:'#e8ff5a'}}>examples/</a> in the GitHub repository, or explore the <Link to="/workflow" style={{color:'#e8ff5a',textDecoration:'underline'}}>Workflow page</Link> for step-by-step explanations.
            </p>
          </FadeDiv>
        </main>
      </div>
      <style>{`@media(max-width:900px){.docs-grid{grid-template-columns:1fr!important} nav{display:none}}`}</style>
    </MarketingShell>
  );
}
