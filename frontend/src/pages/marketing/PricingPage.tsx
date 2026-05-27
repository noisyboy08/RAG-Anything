import { Link } from 'react-router-dom';
import { MarketingShell } from '../../components/marketing/MarketingShell';
import { FadeDiv } from '../../components/ui/FadeDiv';

const plans = [
  {name:'Self-Hosted',price:'Free',color:'#4af0ff',description:'Run on your own infrastructure. Full control, no vendor dependency.',badge:null,
    features:['MIT Licensed — no restrictions','All parsers: MinerU, PaddleOCR','All modal processors','Batch processing + delta indexing','Cross-encoder reranking','CLIP multimodal embeddings','Local/offline capable','Community support (GitHub Issues)'],cta:'Get Started',ctaLink:'/docs'},
  {name:'Cloud-Managed',price:'Usage-based',color:'#e8ff5a',description:'Managed deployment, auto-scaling, monitoring, and SLAs.',badge:'Most Popular',
    features:['Everything in Self-Hosted','Managed API endpoints','Auto-scaling workers','Observability + tracing','Multi-user authentication','Storage management UI','SLA guarantees','Priority support'],cta:'Contact us',ctaLink:'/contact'},
  {name:'Enterprise',price:'Custom',color:'#8b5cf6',description:'For large-scale deployments with compliance, SSO, and dedicated support.',badge:null,
    features:['Everything in Cloud-Managed','Air-gapped deployment','SSO / SAML integration','Custom parser integrations','Compliance & audit logs','Dedicated support engineer','SLA: 99.9% uptime','Custom contract terms'],cta:'Contact Sales',ctaLink:'/contact'},
];

const faq = [
  {q:'What LLMs does RAG-Anything support?',a:'Any LLM you can wrap in a function matching the lightrag signature. Examples: OpenAI, Anthropic, Gemini, Ollama, or any other provider.'},
  {q:'Can RAG-Anything run offline?',a:'Yes. Use local models via Ollama, set TIKTOKEN_CACHE_DIR for tokenizer caching, and use local file storage. Everything works without internet after initial model download.'},
  {q:'What embedding models are supported?',a:'Any embedding function you provide. Common: OpenAI text-embedding-3-small, sentence-transformers, or Jina CLIP for multimodal.'},
  {q:'What is the LLM cost of parsing?',a:'Parsing itself is compute, not API-cost. LLM cost comes from modal processors (captioning, summarizing) and entity extraction — roughly 2–5 calls per page for complex documents.'},
  {q:'Is there a managed cloud version?',a:'Not yet as a public product. Contact us if you need help with production deployment architecture.'},
];

export function PricingPage() {
  return (
    <MarketingShell active="pricing" title="Pricing" description="RAG-Anything pricing: open source self-hosted, cloud-managed, and enterprise options.">
      <section style={{padding:'6rem 2rem 4rem',background:'#000000',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-20%',right:'-10%',width:'45%',height:'50%',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)',filter:'blur(60px)',pointerEvents:'none'}} />
        <div style={{maxWidth:'1280px',margin:'0 auto',textAlign:'center'}}>
          <FadeDiv>
            <span style={{display:'inline-block',padding:'4px 14px',borderRadius:'9999px',background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.2)',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#c084fc',marginBottom:'1.25rem'}}>Pricing</span>
            <h1 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'clamp(2rem,4vw,3.5rem)',lineHeight:1.1,letterSpacing:'-0.03em',color:'white',margin:'0 0 1.25rem'}}>Open source core. Bring your own infrastructure.</h1>
            <p style={{fontSize:'1.05rem',lineHeight:1.8,color:'rgba(255,255,255,0.45)',maxWidth:'600px',margin:'0 auto'}}>MIT licensed. Your production cost depends on parser stack, storage backend, model provider, document volume, and deployment target.</p>
          </FadeDiv>
        </div>
      </section>

      <section style={{padding:'2rem 2rem 6rem',background:'#000000'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'1.5rem'}}>
          {plans.map((plan,i)=>(
            <FadeDiv key={i} delay={i*100}>
              <div style={{padding:'2rem',borderRadius:'20px',position:'relative',height:'100%',
                background:plan.badge?`${plan.color}08`:'rgba(255,255,255,0.03)',
                border:plan.badge?`2px solid ${plan.color}40`:'1px solid rgba(255,255,255,0.08)',
                boxShadow:plan.badge?`0 0 40px ${plan.color}10`:'none',transition:'all 0.3s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';}}>
                {plan.badge&&<div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',padding:'4px 16px',borderRadius:'9999px',background:plan.color,color:'#000000',fontSize:'11px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{plan.badge}</div>}
                <p style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'1rem',color:plan.color,margin:'0 0 0.5rem',letterSpacing:'0.05em',textTransform:'uppercase'}}>{plan.name}</p>
                <div style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'2.5rem',color:'white',lineHeight:1,margin:'0 0 0.5rem'}}>{plan.price}</div>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:'13.5px',lineHeight:1.6,margin:'0 0 1.75rem'}}>{plan.description}</p>
                <ul style={{listStyle:'none',margin:'0 0 2rem',padding:0,display:'flex',flexDirection:'column',gap:'10px'}}>
                  {plan.features.map(f=><li key={f} style={{display:'flex',alignItems:'flex-start',gap:'10px',fontSize:'13.5px',color:'rgba(255,255,255,0.55)'}}><span style={{color:plan.color,flexShrink:0,marginTop:'2px'}}>✓</span>{f}</li>)}
                </ul>
                <Link to={plan.ctaLink} style={{display:'block',textAlign:'center',padding:'12px 24px',borderRadius:'10px',textDecoration:'none',fontWeight:700,fontSize:'14px',transition:'all 0.2s',
                  background:plan.badge?`linear-gradient(135deg,${plan.color},${plan.color}bb)`:'transparent',
                  color:plan.badge?'#000000':plan.color,border:plan.badge?'none':`1px solid ${plan.color}40`}}>
                  {plan.cta}
                </Link>
              </div>
            </FadeDiv>
          ))}
        </div>
      </section>

      <section style={{padding:'5rem 2rem',background:'rgba(255,255,255,0.015)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:'760px',margin:'0 auto'}}>
          <FadeDiv style={{textAlign:'center',marginBottom:'3rem'}}>
            <h2 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:800,fontSize:'2rem',color:'white',margin:0,letterSpacing:'-0.02em'}}>Frequently Asked Questions</h2>
          </FadeDiv>
          {faq.map((item,i)=>(
            <FadeDiv key={i} delay={i*60} style={{marginBottom:'1rem'}}>
              <div style={{padding:'1.5rem',borderRadius:'14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <h3 style={{fontWeight:600,fontSize:'1rem',color:'white',margin:'0 0 0.75rem'}}>{item.q}</h3>
                <p style={{color:'rgba(255,255,255,0.45)',fontSize:'13.5px',lineHeight:1.7,margin:0}}>{item.a}</p>
              </div>
            </FadeDiv>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
