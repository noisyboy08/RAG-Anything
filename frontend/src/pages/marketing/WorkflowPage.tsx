import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketingShell } from '../../components/marketing/MarketingShell';
import { FadeDiv } from '../../components/ui/FadeDiv';

const steps = [
  {num:'01',color:'#4af0ff',title:'Configure',icon:'⚙️',time:'~2 min',
    detail:'Choose working directory, parser, parse method, concurrency, context window, and which modal processors to enable. All configuration via type-safe RAGAnythingConfig dataclass.',
    code:`from raganything import RAGAnything, RAGAnythingConfig\n\nconfig = RAGAnythingConfig(\n    working_dir="./rag_storage",\n    parser="mineru",\n    parse_method="auto",\n    enable_image_processing=True,\n    enable_table_processing=True,\n    enable_cross_encoder=True,\n)\n\nrag = RAGAnything(\n    config=config,\n    llm_model_func=your_llm_func,\n    embedding_func=your_embed_func,\n)`,
    tips:['Set working_dir to a persistent path for production','Increase max_concurrent_files for large batches','Enable cross_encoder for higher-precision answers']},
  {num:'02',color:'#e8ff5a',title:'Parse',icon:'📄',time:'secs–mins',
    detail:'Convert each document into a normalized content list. The parser extracts text blocks, tables, images, and equations with page indices, types, and position metadata.',
    code:`await rag.initialize_lightrag()\n\n# Single file\nawait rag.process_document_complete(\n    "research_paper.pdf",\n    output_dir="./output",\n)\n\n# Batch directory\nfrom raganything import BatchParser\nbatch = BatchParser(parser_type="mineru", max_workers=4)\nresult = batch.process_batch(\n    file_paths=["./documents/"],\n    output_dir="./output",\n    recursive=True,\n)`,
    tips:['Use dry_run=True first to preview what will be processed','Set timeout_per_file for large PDFs','Delta indexing skips unchanged files automatically']},
  {num:'03',color:'#8b5cf6',title:'Enrich',icon:'🧠',time:'Automatic',
    detail:'Modal processors transform non-text content into LLM-generated descriptions. Images get captions. Tables become structured summaries. Equations are explained naturally.',
    code:`# Enrichment is automatic during process_document_complete.\n# Each processor uses your LLM:\n\n# Image: "Describe this image. Context: {text}"\n# Table: "Summarize this table: {headers}"\n# Equation: "Explain: {latex}"\n\n# Customize by subclassing:\nfrom raganything.modalprocessors import ImageModalProcessor\n\nclass MyProcessor(ImageModalProcessor):\n    async def process_image(self, ...):\n        # custom captioning logic\n        ...`,
    tips:['Context window controls how many pages the processor sees','Pydantic schemas validate all LLM outputs automatically','Processors run concurrently across content items']},
  {num:'04',color:'#f472b6',title:'Insert',icon:'🗄️',time:'Automatic',
    detail:'Processed text and modal summaries are inserted into LightRAG. LightRAG extracts entities and relations, embeds chunks, and indexes everything for retrieval.',
    code:`# Insertion happens inside process_document_complete.\n# You can also insert directly:\nawait rag.lightrag.ainsert("Your text content...")\n\n# Batch insert:\nawait rag.lightrag.ainsert_batch([\n    "Document 1 content...",\n    "Document 2 content...",\n])\n\n# Finalize on shutdown:\nawait rag.finalize_storages()`,
    tips:['LightRAG automatically deduplicates entities','Graph storage persists between sessions','Finalize storages cleanly with finalize_storages()']},
  {num:'05',color:'#fbbf24',title:'Query',icon:'💬',time:'Real-time',
    detail:'Ask natural language questions over the knowledge base. 5 query modes: local, global, hybrid, naive, or mix. Multimodal queries combine text with images, tables, or equations.',
    code:`# Text query\nanswer = await rag.aquery(\n    "What are the key findings?",\n    mode="mix",\n    top_k=10,\n)\n\n# Multimodal query\nresult = await rag.aquery_with_multimodal(\n    "Analyze this figure",\n    multimodal_content=[{\n        "type": "image",\n        "img_path": "./figure_2.png",\n    }],\n    mode="hybrid",\n)`,
    tips:['mix mode gives best results for most use cases','local mode is faster for entity-specific questions','VLM-enhanced query requires a vision model function']},
];

function hl(code: string) {
  return code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(#.*$)/gm,'<span style="color:rgba(255,255,255,0.35);font-style:italic">$1</span>')
    .replace(/\b(from|import|await|async|True|False|None|class|def|return)\b/g,'<span style="color:#c084fc">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g,'<span style="color:#86efac">$1</span>');
}

export function WorkflowPage() {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <MarketingShell active="workflow" title="Workflow" description="RAG-Anything 5-step workflow: Configure, Parse, Enrich, Insert, Query — with real code examples.">
      <section style={{padding:'6rem 2rem 4rem',background:'#000000',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-20%',right:'-5%',width:'40%',height:'50%',borderRadius:'50%',background:'radial-gradient(circle,rgba(251,191,36,0.06) 0%,transparent 70%)',filter:'blur(60px)',pointerEvents:'none'}} />
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <FadeDiv style={{textAlign:'center',maxWidth:'720px',margin:'0 auto'}}>
            <span style={{display:'inline-block',padding:'4px 14px',borderRadius:'9999px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#fbbf24',marginBottom:'1.25rem'}}>Workflow</span>
            <h1 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'clamp(2rem,4vw,3.5rem)',lineHeight:1.1,letterSpacing:'-0.03em',color:'white',margin:'0 0 1.25rem'}}>A practical document-to-RAG workflow.</h1>
            <p style={{fontSize:'1.05rem',lineHeight:1.8,color:'rgba(255,255,255,0.45)',margin:'0 0 2.5rem'}}>5 steps from file to production knowledge graph, each with real code you can copy and run.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',justifyContent:'center'}}>
              {steps.map((s,i)=>(
                <button key={i} onClick={()=>setActiveStep(i)} style={{padding:'8px 16px',borderRadius:'9999px',cursor:'pointer',border:'none',
                  background:activeStep===i?s.color:'rgba(255,255,255,0.05)',color:activeStep===i?'#000000':'rgba(255,255,255,0.45)',
                  fontSize:'13px',fontWeight:activeStep===i?700:500,transition:'all 0.2s',fontFamily:'inherit'}}>
                  {s.num} {s.title}
                </button>
              ))}
            </div>
          </FadeDiv>
        </div>
      </section>

      {steps.map((step,i)=>(
        <section key={i} style={{padding:'5rem 2rem',background:i%2===0?'#000000':'rgba(255,255,255,0.015)',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
          <div style={{maxWidth:'1280px',margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:'4rem',alignItems:'start'}} className="hero-grid">
            <FadeDiv>
              <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'1.5rem'}}>
                <span style={{width:'48px',height:'48px',borderRadius:'14px',display:'grid',placeItems:'center',background:`${step.color}15`,border:`2px solid ${step.color}40`,fontSize:'1.5rem',flexShrink:0}}>{step.icon}</span>
                <div>
                  <span style={{fontSize:'11px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:`${step.color}99`}}>Step {step.num}</span>
                  <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1.8rem',color:'white',margin:'2px 0 0',letterSpacing:'-0.02em'}}>{step.title}</h2>
                </div>
              </div>
              <p style={{color:'rgba(255,255,255,0.55)',fontSize:'14.5px',lineHeight:1.8,marginBottom:'1.5rem'}}>{step.detail}</p>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'1.25rem'}}>
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:step.color}} />
                <span style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>Estimated time: <strong style={{color:step.color}}>{step.time}</strong></span>
              </div>
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'1.25rem'}}>
                <p style={{fontSize:'11px',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',margin:'0 0 0.75rem',fontWeight:600}}>💡 Tips</p>
                <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'8px'}}>
                  {step.tips.map(tip=><li key={tip} style={{display:'flex',gap:'8px',fontSize:'13px',color:'rgba(255,255,255,0.45)'}}><span style={{color:step.color,flexShrink:0}}>→</span>{tip}</li>)}
                </ul>
              </div>
            </FadeDiv>
            <FadeDiv delay={150}>
              <div style={{background:'#080808',borderRadius:'16px',border:`1px solid ${step.color}20`,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',borderBottom:`1px solid ${step.color}15`,display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{width:'8px',height:'8px',borderRadius:'50%',background:step.color}} />
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>step_{i+1}.py</span>
                </div>
                <pre style={{margin:0,padding:'1.25rem 1.5rem',fontFamily:"'JetBrains Mono',monospace",fontSize:'12.5px',lineHeight:1.8,color:'rgba(255,255,255,0.65)',overflowX:'auto'}}>
                  <code dangerouslySetInnerHTML={{__html:hl(step.code)}} />
                </pre>
              </div>
            </FadeDiv>
          </div>
        </section>
      ))}

      <FadeDiv style={{padding:'5rem 2rem',background:'#000000',borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:'0 0 1rem',letterSpacing:'-0.02em'}}>Ready to run your first pipeline?</h2>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:'1rem',lineHeight:1.75,margin:'0 0 2rem'}}>Install the package and follow the complete setup guide.</p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <Link to="/docs" className="btn-primary">Read the Docs →</Link>
            
          </div>
        </div>
      </FadeDiv>
      <style>{`@media(max-width:768px){.hero-grid{grid-template-columns:1fr!important;gap:2rem!important}}`}</style>
    </MarketingShell>
  );
}
