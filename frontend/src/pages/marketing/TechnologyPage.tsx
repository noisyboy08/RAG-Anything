import { Link } from 'react-router-dom';
import { MarketingShell } from '../../components/marketing/MarketingShell';
import { FadeDiv } from '../../components/ui/FadeDiv';

const stackLayers = [
  {title:'Python Core',version:'Python ≥ 3.10',color:'#e8ff5a',icon:'🐍',detail:'Dataclass-based RAGAnything class orchestrates everything. Async-first with asyncio.Semaphore controls. Mixin-based architecture. Pydantic v2 for all LLM output validation.',items:['Async/await throughout','Pydantic v2 schemas','Dataclass config','Mixin architecture']},
  {title:'LightRAG',version:'HKUDS/LightRAG',color:'#e8ff5a',icon:'🕸️',detail:'The retrieval backbone. Stores chunks, entities, and relations in a knowledge graph. Supports local, global, hybrid, naive, and mix query modes. Custom embedding function support.',items:['Entity + relation graph','5 query modes','Custom embedding support','KV cache storage']},
  {title:'MinerU Parser',version:'opendatalab/MinerU',color:'#e8ff5a',icon:'⛏️',detail:'Primary PDF parser providing layout-preserving extraction. Detects text blocks, tables, figures, equations, and reading order. Handles multi-column PDFs and complex layouts.',items:['Layout-preserving extraction','Multi-column detection','Formula and figure detection','Reading order recovery']},
  {title:'PaddleOCR',version:'PaddlePaddle/PaddleOCR',color:'#e8ff5a',icon:'👁️',detail:'Optional secondary parser for scanned documents and image-heavy PDFs. High-accuracy text detection and recognition across 80+ languages.',items:['80+ language support','Layout detection','Table structure recognition','High-res document support']},
  {title:'sentence-transformers',version:'huggingface/sentence-transformers',color:'#e8ff5a',icon:'🧬',detail:'Powers optional CLIP multimodal embeddings and CrossEncoder reranking. CLIP models embed images and text jointly. CrossEncoders score query-passage pairs for precision.',items:['CLIP multimodal embeddings','CrossEncoder reranking','ms-marco-MiniLM-L-6-v2','jinaai/jina-clip-v1']},
  {title:'React + Vite + Three.js',version:'React 18 · Vite 5 · Three.js r160',color:'#e8ff5a',icon:'⚡',detail:'React 18 with TypeScript for the UI, Vite for fast dev and optimized builds, Three.js for the WebGL knowledge graph with orbit camera, particle effects, and MediaPipe hand tracking.',items:['React 18 + TypeScript','Three.js WebGL graph','MediaPipe hand tracking','Zustand state']},
];

const archNodes = [
  { step: 'Input', title: 'Document', detail: 'PDF, Image, Office, Markdown' },
  { step: 'Extract', title: 'Parser Layer', detail: 'MinerU → PaddleOCR → Text Converter' },
  { step: 'Unify', title: 'Normalization Layer', detail: '[{type, content, page, context}, ...]' },
  { step: 'Enhance', title: 'Processing Layer', detail: 'LLM captions, summaries, explanations' },
  { step: 'Store', title: 'LightRAG Layer', detail: 'Entity extraction, vector index, graph' },
];

export function TechnologyPage() {
  return (
    <MarketingShell active="technology" title="Technology" description="RAG-Anything tech stack: Python, LightRAG, MinerU, PaddleOCR, sentence-transformers, React, Three.js.">
      <section style={{padding:'6rem 2rem 4rem',background:'#000000',position:'relative',overflow:'hidden'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <FadeDiv style={{maxWidth:'760px'}}>
            <span style={{display:'inline-block',padding:'4px 14px',borderRadius:'9999px',background:'rgba(232,255,90,0.08)',border:'1px solid rgba(232,255,90,0.2)',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#e8ff5a',marginBottom:'1.25rem'}}>Technology</span>
            <h1 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'clamp(2rem,4vw,3.5rem)',lineHeight:1.1,letterSpacing:'-0.03em',color:'white',margin:'0 0 1.5rem'}}>Built as a library first, product surface second.</h1>
            <p style={{fontSize:'1.05rem',lineHeight:1.8,color:'rgba(255,255,255,0.5)',margin:0}}>Every component is chosen for correctness, composability, and production readiness. Swap parsers, embeddings, or LLMs without touching the pipeline.</p>
          </FadeDiv>
        </div>
      </section>

      <section style={{padding:'4rem 2rem 6rem',background:'#000000'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:'1.5rem'}}>
          {stackLayers.map((tech,i)=>(
            <FadeDiv key={i} delay={Math.min(i*70,300)}>
              <div style={{padding:'2rem',borderRadius:'16px',background:'#080808',border:'1px solid rgba(255,255,255,0.08)',transition:'all 0.3s',height:'100%'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=`rgba(232,255,90,0.3)`;e.currentTarget.style.background=`rgba(232,255,90,0.02)`;e.currentTarget.style.transform='translateY(-3px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.background='#080808';e.currentTarget.style.transform='';}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1.25rem'}}>
                  <span style={{fontSize:'2rem',lineHeight:1}}>{tech.icon}</span>
                  <div>
                    <h2 style={{fontWeight:700,fontSize:'1.1rem',color:'white',margin:'0 0 3px'}}>{tech.title}</h2>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'11px',color:`rgba(232,255,90,0.8)`}}>{tech.version}</span>
                  </div>
                </div>
                <p style={{color:'rgba(255,255,255,0.5)',fontSize:'13.5px',lineHeight:1.7,margin:'0 0 1.25rem'}}>{tech.detail}</p>
                <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'8px'}}>
                  {tech.items.map(item=><li key={item} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'rgba(255,255,255,0.6)'}}><span style={{width:'5px',height:'5px',borderRadius:'50%',background:tech.color,flexShrink:0}} />{item}</li>)}
                </ul>
              </div>
            </FadeDiv>
          ))}
        </div>
      </section>

      <section style={{padding:'5rem 2rem',background:'#080808',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:'800px',margin:'0 auto'}}>
          <FadeDiv style={{textAlign:'center',marginBottom:'3rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:'0 0 0.75rem',letterSpacing:'-0.02em'}}>Architecture Overview</h2>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:'14.5px',lineHeight:1.7}}>How the layers connect end-to-end</p>
          </FadeDiv>
          
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem'}}>
            {archNodes.map((node, i) => (
              <FadeDiv key={i} delay={i * 100} style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{width:'100%',background:'#000000',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',padding:'1.5rem',display:'flex',alignItems:'center',gap:'1.5rem'}}>
                  <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'rgba(232,255,90,0.1)',display:'flex',alignItems:'center',justifyContent:'center',color:'#e8ff5a',fontFamily:"'JetBrains Mono',monospace",fontSize:'12px',fontWeight:700,border:'1px solid rgba(232,255,90,0.2)',flexShrink:0}}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div style={{fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.1em',color:'rgba(255,255,255,0.4)',marginBottom:'4px'}}>{node.step}</div>
                    <div style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:700,fontSize:'1.1rem',color:'white',marginBottom:'4px'}}>{node.title}</div>
                    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.5)'}}>{node.detail}</div>
                  </div>
                </div>
                {i < archNodes.length - 1 && (
                  <div style={{width:'2px',height:'30px',background:'linear-gradient(to bottom, rgba(232,255,90,0.5), rgba(255,255,255,0.1))',margin:'0.5rem 0'}} />
                )}
              </FadeDiv>
            ))}
          </div>
        </div>
      </section>

      <FadeDiv style={{padding:'5rem 2rem',background:'#000000',textAlign:'center',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:'560px',margin:'0 auto'}}>
          <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Ready to dig into the code?</h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:'1rem',lineHeight:1.75,margin:'0 0 2rem'}}>The repository is fully open source. Start with the README or jump to the API.</p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <a href="https://github.com/noisyboy08/RAG-Anything" target="_blank" rel="noopener noreferrer" className="btn-primary">View on GitHub →</a>
            <Link to="/workflow" className="btn-secondary">See the Workflow</Link>
          </div>
        </div>
      </FadeDiv>
    </MarketingShell>
  );
}
