import { Link } from 'react-router-dom';
import { MarketingShell } from '../../components/marketing/MarketingShell';
import { FadeDiv } from '../../components/ui/FadeDiv';

const pillars = [
  {icon:'🏗️',color:'#e8ff5a',title:'Library First',detail:'RAG-Anything is a Python package before anything else. Every feature is accessible programmatically with full type annotations, async support, and composable abstractions.'},
  {icon:'🌐',color:'#4af0ff',title:'Modality Parity',detail:'Text, images, tables, and equations are first-class citizens. Every modality gets its own processor, storage path, and retrieval context.'},
  {icon:'🔓',color:'#8b5cf6',title:'Open Source',detail:'MIT licensed. No vendor lock-in. Bring your own LLM, embedding model, parser, and storage backend. The framework stays out of the way.'},
];

const timeline = [
  {year:'2024 Q1',event:'Initial architecture: LightRAG integration + MinerU parser adapter'},
  {year:'2024 Q2',event:'Modal processors: Image, Table, Equation with context-aware prompts'},
  {year:'2024 Q3',event:'Batch processing: parallel workers, progress bars, timeout controls'},
  {year:'2024 Q4',event:'Frontend: Three.js graph workspace + MediaPipe hand tracking'},
  {year:'2025 Q1',event:'Upgrades: Pydantic outputs, delta indexing, async workers, CLIP embeddings, CrossEncoder'},
];

export function AboutPage() {
  return (
    <MarketingShell active="about" title="About" description="About RAG-Anything: mission, design principles, and history of the multimodal RAG framework.">
      <section style={{padding:'6rem 2rem 5rem',background:'#000000',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:'50%',height:'50%',borderRadius:'50%',background:'radial-gradient(circle,rgba(232,255,90,0.06) 0%,transparent 70%)',filter:'blur(80px)',pointerEvents:'none'}} />
        <div style={{maxWidth:'900px',margin:'0 auto'}}>
          <FadeDiv>
            <span style={{display:'inline-block',padding:'4px 14px',borderRadius:'9999px',background:'rgba(232,255,90,0.08)',border:'1px solid rgba(232,255,90,0.2)',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#e8ff5a',marginBottom:'1.25rem'}}>About</span>
            <h1 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'clamp(2rem,4vw,3.5rem)',lineHeight:1.1,letterSpacing:'-0.03em',color:'white',margin:'0 0 1.5rem'}}>RAG-Anything makes multimodal knowledge usable.</h1>
            <p style={{fontSize:'1.1rem',lineHeight:1.85,color:'rgba(255,255,255,0.45)',maxWidth:'700px',margin:'0 0 1.5rem'}}>Most RAG systems start and stop at plain text. Real documents are richer: diagrams, scanned pages, data tables, LaTeX equations, reports, and mixed-format corpora. RAG-Anything was built for exactly those documents.</p>
            <p style={{fontSize:'1.05rem',lineHeight:1.85,color:'rgba(255,255,255,0.45)',maxWidth:'700px',margin:0}}>The design philosophy: keep parsing, enrichment, and retrieval <strong style={{color:'rgba(255,255,255,0.55)'}}>modular</strong> so teams can replace pieces without rewriting the pipeline.</p>
          </FadeDiv>
        </div>
      </section>

      <section style={{padding:'5rem 2rem',background:'rgba(255,255,255,0.015)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <FadeDiv style={{textAlign:'center',marginBottom:'3rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:0,letterSpacing:'-0.02em'}}>Design Principles</h2>
          </FadeDiv>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.5rem'}}>
            {pillars.map((p,i)=>(
              <FadeDiv key={i} delay={i*100}>
                <div style={{padding:'2rem',borderRadius:'16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',transition:'all 0.3s',height:'100%'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${p.color}30`;e.currentTarget.style.transform='translateY(-3px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.transform='';}}>
                  <span style={{fontSize:'2.5rem',display:'block',marginBottom:'1.25rem'}}>{p.icon}</span>
                  <h3 style={{fontWeight:700,fontSize:'1.15rem',color:'white',margin:'0 0 0.75rem'}}>{p.title}</h3>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:'13.5px',lineHeight:1.7,margin:0}}>{p.detail}</p>
                </div>
              </FadeDiv>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:'5rem 2rem',background:'#000000',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:'800px',margin:'0 auto'}}>
          <FadeDiv style={{marginBottom:'3rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:'0 0 0.75rem',letterSpacing:'-0.02em'}}>Development History</h2>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:'14.5px',lineHeight:1.7,margin:0}}>Key milestones in the framework's evolution</p>
          </FadeDiv>
          {timeline.map((item,i)=>(
            <FadeDiv key={i} delay={i*70} style={{display:'flex',gap:'1.5rem',paddingBottom:i<timeline.length-1?'2rem':0}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                <div style={{width:'12px',height:'12px',borderRadius:'50%',background:'#e8ff5a',boxShadow:'0 0 12px rgba(232,255,90,0.6)',marginTop:'4px'}} />
                {i<timeline.length-1&&<div style={{width:'2px',flex:1,marginTop:'8px',background:'linear-gradient(180deg,rgba(232,255,90,0.4),rgba(232,255,90,0.05))'}} />}
              </div>
              <div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'11px',color:'#e8ff5a',fontWeight:600}}>{item.year}</span>
                <p style={{color:'rgba(255,255,255,0.55)',fontSize:'14px',lineHeight:1.7,margin:'4px 0 0'}}>{item.event}</p>
              </div>
            </FadeDiv>
          ))}
        </div>
      </section>

      <FadeDiv style={{padding:'5rem 2rem',background:'#000000',borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <span style={{display:'inline-block',padding:'4px 14px',borderRadius:'9999px',background:'rgba(232,255,90,0.08)',border:'1px solid rgba(232,255,90,0.2)',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#e8ff5a',marginBottom:'1.25rem'}}>Open Source · MIT</span>
          <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Built in the open. Used in production.</h2>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:'1rem',lineHeight:1.75,margin:'0 0 2rem'}}>Contributions, issue reports, and usage examples are welcome. Start with the README.</p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <a href="https://github.com/noisyboy08/RAG-Anything" target="_blank" rel="noopener noreferrer" className="btn-primary">Star on GitHub →</a>
            <Link to="/contact" className="btn-secondary">Get in Touch</Link>
          </div>
        </div>
      </FadeDiv>
    </MarketingShell>
  );
}
