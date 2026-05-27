import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingShell } from '../../components/marketing/MarketingShell';
import { FadeDiv } from '../../components/ui/FadeDiv';

const features = [
  {icon:'📄',color:'#e8ff5a',title:'Multimodal Parsing',detail:'PDF, image, Word, Excel, PowerPoint, Markdown, and text ingestion with parser-specific fallbacks.',tags:['PDF','Images','Office','Markdown']},
  {icon:'🧩',color:'#4af0ff',title:'Context-Aware Processing',detail:'Images, tables, and equations are enriched with surrounding text context. Processors see page neighbors for richer captions.',tags:['Context window','Page-aware','Cross-modal']},
  {icon:'⚡',color:'#8b5cf6',title:'Batch Workflows',detail:'Process entire directories with recursive discovery, dry-run mode, per-file timeouts, and parallel async workers.',tags:['Async','Parallel','Progress bar','Dry-run']},
  {icon:'💾',color:'#f472b6',title:'Incremental Delta Indexing',detail:'IndexManifest tracks SHA-256 hashes of every processed file. Re-runs skip unchanged files automatically.',tags:['SHA-256','Hash tracking','Skip unchanged']},
  {icon:'🏗️',color:'#fbbf24',title:'Pydantic Structured Outputs',detail:'All LLM responses validated against strict Pydantic schemas before storage — no silent data corruption.',tags:['Pydantic','Validation','Type-safe']},
  {icon:'🔗',color:'#e8ff5a',title:'Cross-Encoder Reranking',detail:'Optionally enable a CrossEncoder to precision-rerank retrieved context before the LLM — reducing hallucinations.',tags:['ms-marco','Reranking','Precision']},
  {icon:'🖼️',color:'#4af0ff',title:'True Multimodal Embeddings',detail:'Use CLIP (Jina or similar) to embed images and text in the same vector space for joint similarity search.',tags:['CLIP','Jina','Joint embeddings']},
  {icon:'🌐',color:'#8b5cf6',title:'Offline-Capable',detail:'Tiktoken cache, local model paths, and environment-driven config mean RAG-Anything works air-gapped.',tags:['Local models','Air-gapped','Tiktoken cache']},
  {icon:'🖥️',color:'#f472b6',title:'Interactive 3D Graph UI',detail:'Three.js WebGL graph with webcam hand-tracking, node filtering, semantic coloring, and RAG query panel.',tags:['Three.js','MediaPipe','WebGL']},
];

const comparison = [
  {feature:'PDF parsing',rag:true,lightrag:false,plain:false},
  {feature:'Image captioning',rag:true,lightrag:false,plain:false},
  {feature:'Table summarization',rag:true,lightrag:false,plain:false},
  {feature:'Equation processing',rag:true,lightrag:false,plain:false},
  {feature:'Graph-grounded retrieval',rag:true,lightrag:true,plain:false},
  {feature:'Batch processing',rag:true,lightrag:false,plain:false},
  {feature:'Delta indexing',rag:true,lightrag:false,plain:false},
  {feature:'Cross-encoder reranking',rag:true,lightrag:false,plain:false},
  {feature:'CLIP embeddings',rag:true,lightrag:false,plain:false},
  {feature:'Local/offline',rag:true,lightrag:true,plain:true},
];

function Check({v}:{v:boolean}){return v?<span style={{color:'#e8ff5a',fontSize:'16px'}}>✓</span>:<span style={{color:'#2a3a32',fontSize:'16px'}}>—</span>;}

export function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState<number|null>(null);
  return (
    <MarketingShell active="features" title="Features" description="All RAG-Anything features: multimodal parsing, batch workflows, delta indexing, CLIP embeddings.">
      <section style={{padding:'6rem 2rem 4rem',background:'#000000',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-20%',left:'-5%',width:'40%',height:'50%',borderRadius:'50%',background:'radial-gradient(circle,rgba(232,255,90,0.06) 0%,transparent 70%)',filter:'blur(60px)',pointerEvents:'none'}} />
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <FadeDiv style={{textAlign:'center',maxWidth:'720px',margin:'0 auto'}}>
            <span style={{display:'inline-block',padding:'4px 14px',borderRadius:'9999px',background:'rgba(232,255,90,0.08)',border:'1px solid rgba(232,255,90,0.2)',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#e8ff5a',marginBottom:'1.25rem'}}>Features</span>
            <h1 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'clamp(2rem,4vw,3.5rem)',lineHeight:1.1,letterSpacing:'-0.03em',color:'white',margin:'0 0 1.25rem'}}>Everything for serious document RAG.</h1>
            <p style={{fontSize:'1.05rem',lineHeight:1.8,color:'rgba(255,255,255,0.45)',margin:0}}>From single-file processing to batch pipelines with delta indexing, cross-encoder reranking, and multimodal embeddings.</p>
          </FadeDiv>
        </div>
      </section>

      <section style={{padding:'4rem 2rem 6rem',background:'#000000'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'1.25rem'}}>
          {features.map((f,i)=>(
            <FadeDiv key={i} delay={Math.min(i*50,300)}>
              <div onClick={()=>setActiveFeature(activeFeature===i?null:i)}
                style={{padding:'1.75rem',borderRadius:'16px',cursor:'pointer',height:'100%',
                  background:activeFeature===i?`${f.color}08`:'rgba(255,255,255,0.03)',
                  border:activeFeature===i?`1px solid ${f.color}40`:'1px solid rgba(255,255,255,0.07)',transition:'all 0.3s'}}
                onMouseEnter={e=>{if(activeFeature!==i){e.currentTarget.style.borderColor=`${f.color}25`;e.currentTarget.style.transform='translateY(-3px)';}}}
                onMouseLeave={e=>{if(activeFeature!==i){e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.transform='';}}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'1rem'}}>
                  <span style={{fontSize:'1.75rem',lineHeight:1,flexShrink:0}}>{f.icon}</span>
                  <h2 style={{fontWeight:700,fontSize:'1.05rem',color:'white',margin:'2px 0 0'}}>{f.title}</h2>
                </div>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:'13.5px',lineHeight:1.7,margin:'0 0 1rem'}}>{f.detail}</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {f.tags.map(tag=><span key={tag} style={{padding:'3px 10px',borderRadius:'9999px',background:`${f.color}12`,border:`1px solid ${f.color}25`,color:f.color,fontSize:'11px',fontWeight:500}}>{tag}</span>)}
                </div>
              </div>
            </FadeDiv>
          ))}
        </div>
      </section>

      <section style={{padding:'5rem 2rem',background:'rgba(255,255,255,0.015)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:'900px',margin:'0 auto'}}>
          <FadeDiv style={{textAlign:'center',marginBottom:'3rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:'0 0 0.75rem',letterSpacing:'-0.02em'}}>RAG-Anything vs alternatives</h2>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:'14.5px',lineHeight:1.7}}>What you get that plain RAG or LightRAG alone cannot provide.</p>
          </FadeDiv>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                  <th style={{padding:'16px 20px',textAlign:'left',fontSize:'12px',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.35)',fontWeight:600}}>Feature</th>
                  <th style={{padding:'16px 20px',textAlign:'center',fontSize:'12px',color:'#e8ff5a',fontWeight:700}}>RAG-Anything</th>
                  <th style={{padding:'16px 20px',textAlign:'center',fontSize:'12px',color:'#4af0ff',fontWeight:600}}>LightRAG</th>
                  <th style={{padding:'16px 20px',textAlign:'center',fontSize:'12px',color:'rgba(255,255,255,0.45)',fontWeight:600}}>Plain RAG</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row,i)=>(
                  <tr key={i} style={{borderBottom:i<comparison.length-1?'1px solid rgba(255,255,255,0.04)':'none',background:i%2===0?'transparent':'rgba(255,255,255,0.015)'}}>
                    <td style={{padding:'13px 20px',fontSize:'13.5px',color:'rgba(255,255,255,0.55)'}}>{row.feature}</td>
                    <td style={{padding:'13px 20px',textAlign:'center'}}><Check v={row.rag}/></td>
                    <td style={{padding:'13px 20px',textAlign:'center'}}><Check v={row.lightrag}/></td>
                    <td style={{padding:'13px 20px',textAlign:'center'}}><Check v={row.plain}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FadeDiv style={{padding:'5rem 2rem',background:'#000000',textAlign:'center',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:'560px',margin:'0 auto'}}>
          <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>See all features in action</h2>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:'1rem',lineHeight:1.75,margin:'0 0 2rem'}}>Read the setup guide and have your first pipeline running in minutes.</p>
          <Link to="/docs" className="btn-primary" style={{fontSize:'1rem',padding:'14px 32px'}}>Read Setup Guide →</Link>
        </div>
      </FadeDiv>
    </MarketingShell>
  );
}
