import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MarketingShell } from '../../components/marketing/MarketingShell';

function useScrollFade(delay=0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el=ref.current; if(!el) return;
    el.style.opacity='0'; el.style.transform='translateY(36px)';
    el.style.transition=`opacity 0.7s ${delay}ms ease,transform 0.7s ${delay}ms ease`;
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting){el.style.opacity='1';el.style.transform='translateY(0)';obs.disconnect();} },{threshold:0.1});
    obs.observe(el); return () => obs.disconnect();
  },[delay]);
  return ref;
}

const layers = [
  {num:'01',color:'#4af0ff',title:'Parser Layer',subtitle:'MinerU · PaddleOCR · Text converter',
    detail:'Every document enters through the parser layer. MinerU is the primary PDF parser. PaddleOCR handles scanned documents. Built-in converters handle .docx, .pptx, .xlsx, .txt, and .md files.',
    features:['MinerU PDF parsing','PaddleOCR for scanned docs','Office file conversion','Auto-detect parse method'],
    code:`config = RAGAnythingConfig(\n    parser="mineru",     # or "paddleocr"\n    parse_method="auto", # auto | txt | ocr\n)`},
  {num:'02',color:'#e8ff5a',title:'Normalization Layer',subtitle:'Unified content list contract',
    detail:'Every parser emits a normalized content list. Each item carries its page index, content type (text/table/image/equation), raw data, and position context.',
    features:['Type: text | table | image | equation','Page index tracking','Position and layout metadata','Surrounding text context'],
    code:`content = [\n  {"type":"text",  "content":"..."},\n  {"type":"table", "table_body":"..."},\n  {"type":"image", "img_path":"..."},\n  {"type":"equation","latex":"..."},\n]`},
  {num:'03',color:'#8b5cf6',title:'Processing Layer',subtitle:'Modal processors for non-text content',
    detail:'Specialized modal processors transform non-text content. The Image processor generates captions. The Table processor creates summaries. The Equation processor explains LaTeX naturally.',
    features:['Image captioning via LLM','Table structured summarization','Equation natural-language explanation','Configurable context window'],
    code:`config = RAGAnythingConfig(\n    enable_image_processing=True,\n    enable_table_processing=True,\n    enable_equation_processing=True,\n    context_window=1,\n)`},
  {num:'04',color:'#f472b6',title:'Retrieval Layer',subtitle:'LightRAG graph-grounded storage',
    detail:'Processed content flows into LightRAG which builds a knowledge graph. Entities and relations are extracted and stored. At query time, LightRAG combines vector similarity with graph traversal.',
    features:['Entity + relation extraction','Graph-aware context assembly','Local / global / hybrid search modes','Mix mode: best of both'],
    code:`answer = await rag.aquery(\n    "Explain the findings",\n    mode="mix"\n)\n\nresult = await rag.aquery_with_multimodal(\n    "Analyze this figure",\n    multimodal_content=[{...}]\n)`},
];

export function PlatformPage() {
  // All hooks at top level
  const heroRef = useScrollFade(0);
  const l0r = useScrollFade(0); const l0c = useScrollFade(150);
  const l1r = useScrollFade(0); const l1c = useScrollFade(150);
  const l2r = useScrollFade(0); const l2c = useScrollFade(150);
  const l3r = useScrollFade(0); const l3c = useScrollFade(150);
  const layerRefs = [[l0r,l0c],[l1r,l1c],[l2r,l2c],[l3r,l3c]];
  const ctaRef = useScrollFade(0);

  return (
    <MarketingShell active="platform" title="Platform" description="RAG-Anything platform: 4-layer architecture from parser to graph-grounded retrieval.">
      <section style={{padding:'6rem 2rem 4rem',background:'#000000',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-30%',right:'-10%',width:'50%',height:'60%',borderRadius:'50%',background:'radial-gradient(circle,rgba(74,240,255,0.06) 0%,transparent 70%)',filter:'blur(60px)',pointerEvents:'none'}} />
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <div ref={heroRef} style={{maxWidth:'800px'}}>
            <span style={{display:'inline-block',padding:'4px 14px',borderRadius:'9999px',background:'rgba(74,240,255,0.08)',border:'1px solid rgba(74,240,255,0.2)',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#4af0ff',marginBottom:'1.25rem'}}>Platform</span>
            <h1 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'clamp(2rem,4vw,3.5rem)',lineHeight:1.1,letterSpacing:'-0.03em',color:'white',margin:'0 0 1.5rem'}}>One framework for multimodal document intelligence.</h1>
            <p style={{fontSize:'1.05rem',lineHeight:1.8,color:'rgba(255,255,255,0.45)',margin:'0 0 2rem'}}>4-layer pipeline: parse documents, preserve content structure, enrich each modality, and make everything retrievable through LightRAG.</p>
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              {layers.map(l=><span key={l.num} style={{padding:'6px 14px',borderRadius:'8px',border:`1px solid ${l.color}30`,background:`${l.color}08`,color:l.color,fontSize:'12px',fontWeight:600}}>{l.num} {l.title}</span>)}
            </div>
          </div>
        </div>
      </section>

      {layers.map((layer,i)=>{
        const [ref, codeRef] = layerRefs[i];
        const isEven = i%2===0;
        return (
          <section key={layer.num} style={{padding:'5rem 2rem',background:isEven?'#000000':'rgba(255,255,255,0.015)',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{maxWidth:'1280px',margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'start'}} className="hero-grid">
              <div ref={ref} style={{order:isEven?0:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1.5rem'}}>
                  <span style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'3rem',color:layer.color,opacity:0.3,lineHeight:1}}>{layer.num}</span>
                  <div>
                    <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.6rem',color:'white',margin:'0 0 4px',letterSpacing:'-0.02em'}}>{layer.title}</h2>
                    <p style={{color:'rgba(255,255,255,0.35)',fontSize:'13px',margin:0}}>{layer.subtitle}</p>
                  </div>
                </div>
                <p style={{color:'rgba(255,255,255,0.55)',fontSize:'14.5px',lineHeight:1.8,marginBottom:'1.5rem'}}>{layer.detail}</p>
                <ul style={{listStyle:'none',margin:'0 0 2rem',padding:0,display:'flex',flexDirection:'column',gap:'10px'}}>
                  {layer.features.map(f=>(
                    <li key={f} style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'13.5px',color:'rgba(255,255,255,0.55)'}}>
                      <span style={{width:'6px',height:'6px',borderRadius:'50%',background:layer.color,boxShadow:`0 0 8px ${layer.color}`,flexShrink:0}} />{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div ref={codeRef} style={{order:isEven?1:0,background:'#080808',borderRadius:'14px',border:`1px solid ${layer.color}20`,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',borderBottom:`1px solid ${layer.color}15`,display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{width:'8px',height:'8px',borderRadius:'50%',background:layer.color}} />
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>example_{i+1}.py</span>
                </div>
                <pre style={{margin:0,padding:'1.25rem 1.5rem',fontFamily:"'JetBrains Mono',monospace",fontSize:'12.5px',lineHeight:1.8,color:'rgba(255,255,255,0.65)',overflowX:'auto'}}>
                  <code dangerouslySetInnerHTML={{__html:layer.code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                    .replace(/(#.*$)/gm,'<span style="color:rgba(255,255,255,0.35);font-style:italic">$1</span>')
                    .replace(/\b(from|import|await|async|True|False|None)\b/g,'<span style="color:#c084fc">$1</span>')
                    .replace(/("(?:[^"\\]|\\.)*")/g,'<span style="color:#86efac">$1</span>')
                  }} />
                </pre>
              </div>
            </div>
          </section>
        );
      })}

      <section ref={ctaRef} style={{padding:'5rem 2rem',background:'#000000',borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Ready to explore the architecture?</h2>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:'1rem',lineHeight:1.75,margin:'0 0 2rem'}}>Install the package and have your first document processed in minutes.</p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <Link to="/docs" className="btn-primary">Read the Docs →</Link>
            <Link to="/features" className="btn-secondary">See All Features</Link>
          </div>
        </div>
      </section>
      <style>{`@media(max-width:768px){.hero-grid{grid-template-columns:1fr!important;gap:2rem!important}}`}</style>
    </MarketingShell>
  );
}
