import { useState } from 'react';
import { MarketingShell } from '../../components/marketing/MarketingShell';
import { FadeDiv } from '../../components/ui/FadeDiv';

const faqs = [
  {q:'What Python version is required?',a:'Python 3.10 or higher.'},
  {q:'How do I report a bug?',a:'Open a GitHub issue with Python version, OS, parser choice, a small reproducible example, and the full traceback.'},
  {q:'Can I request a feature?',a:'Yes. Open a GitHub issue labeled "enhancement" with a description of the use case. PRs are also welcome.'},
  {q:'Is there a Discord community?',a:'Not yet. GitHub Issues and Discussions are the primary channels.'},
];

export function ContactPage() {
  const [form, setForm] = useState({name:'',email:'',subject:'',message:''});
  const [status, setStatus] = useState<'idle'|'sending'|'sent'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    await new Promise(r=>setTimeout(r,900));
    window.open(`mailto:contact@raganything.dev?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`);
    setStatus('sent');
    setTimeout(()=>setStatus('idle'),4000);
  };

  const inputStyle = {padding:'12px 14px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.65)',fontSize:'14px',outline:'none',fontFamily:'inherit',width:'100%',boxSizing:'border-box' as const};
  const focus = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {e.target.style.borderColor='rgba(232,255,90,0.4)';e.target.style.boxShadow='0 0 0 3px rgba(232,255,90,0.08)';};
  const blur = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none';};

  return (
    <MarketingShell active="contact" title="Contact" description="Get in touch with the RAG-Anything team. Report bugs, request features, or ask implementation questions.">
      <section style={{padding:'6rem 2rem 4rem',background:'#000000'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto'}}>
          <FadeDiv style={{maxWidth:'680px'}}>
            <span style={{display:'inline-block',padding:'4px 14px',borderRadius:'9999px',background:'rgba(232,255,90,0.08)',border:'1px solid rgba(232,255,90,0.2)',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'#e8ff5a',marginBottom:'1.25rem'}}>Contact</span>
            <h1 style={{fontFamily:"'Space Grotesk', system-ui",fontWeight:900,fontSize:'clamp(2rem,4vw,3.2rem)',lineHeight:1.1,letterSpacing:'-0.03em',color:'white',margin:'0 0 1.25rem'}}>Get in touch with the team.</h1>
            <p style={{fontSize:'1.05rem',lineHeight:1.8,color:'rgba(255,255,255,0.45)',margin:0}}>For bugs, open a GitHub issue with full details. For implementation questions, check the docs first. Use the form below for anything else.</p>
          </FadeDiv>
        </div>
      </section>

      <section style={{padding:'3rem 2rem 6rem',background:'#000000'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:'4rem',alignItems:'start'}} className="hero-grid">
          <FadeDiv>
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}} className="form-row">
                <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  <span style={{fontSize:'12px',fontWeight:600,letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase'}}>Name</span>
                  <input type="text" placeholder="Your name" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inputStyle} onFocus={focus} onBlur={blur} />
                </label>
                <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  <span style={{fontSize:'12px',fontWeight:600,letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase'}}>Email</span>
                  <input type="email" placeholder="you@company.com" required value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={inputStyle} onFocus={focus} onBlur={blur} />
                </label>
              </div>
              <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <span style={{fontSize:'12px',fontWeight:600,letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase'}}>Subject</span>
                <select required value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} style={{...inputStyle,background:'rgba(5,9,20,0.8)'}} onFocus={focus} onBlur={blur}>
                  <option value="">Select a topic...</option>
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Implementation Question</option>
                  <option>Enterprise / Deployment Inquiry</option>
                  <option>Other</option>
                </select>
              </label>
              <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <span style={{fontSize:'12px',fontWeight:600,letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase'}}>Message</span>
                <textarea required rows={6} placeholder="Describe your issue in detail. Include Python version, OS, and code snippets for bugs." value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} style={{...inputStyle,resize:'vertical',lineHeight:1.7}} onFocus={focus} onBlur={blur} />
              </label>
              <button type="submit" disabled={status==='sending'} style={{padding:'14px 32px',borderRadius:'10px',fontWeight:700,fontSize:'14px',border:'none',cursor:'pointer',fontFamily:'inherit',alignSelf:'flex-start',
                background:status==='sent'?'rgba(232,255,90,0.2)':'linear-gradient(135deg,#e8ff5a,#4af0ff)',color:status==='sent'?'#e8ff5a':'#000000',transition:'all 0.2s',opacity:status==='sending'?0.7:1}}>
                {status==='idle'?'Send Message →':status==='sending'?'Sending…':'✓ Sent!'}
              </button>
            </form>
          </FadeDiv>

          <FadeDiv delay={150} style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <div style={{padding:'1.5rem',borderRadius:'16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1rem'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.65)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                <h3 style={{fontWeight:700,fontSize:'1.05rem',color:'white',margin:0}}>GitHub Issues</h3>
              </div>
              <p style={{color:'rgba(255,255,255,0.45)',fontSize:'13.5px',lineHeight:1.7,margin:'0 0 1rem'}}>For bugs and feature requests, GitHub Issues is the best channel. Include Python version, OS, and a minimal reproducible example.</p>
              <a href="https://github.com/noisyboy08/RAG-Anything/issues" target="_blank" rel="noopener noreferrer"
                style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.65)',fontSize:'13px',textDecoration:'none',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(232,255,90,0.3)';e.currentTarget.style.color='#e8ff5a';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.15)';e.currentTarget.style.color='rgba(255,255,255,0.65)';}}>
                Open an Issue →
              </a>
            </div>
            <div style={{padding:'1.5rem',borderRadius:'16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <h3 style={{fontWeight:700,fontSize:'1.05rem',color:'white',margin:'0 0 1.25rem'}}>Quick Answers</h3>
              {faqs.map((faq,i)=>(
                <div key={i} style={{borderBottom:i<faqs.length-1?'1px solid rgba(255,255,255,0.05)':'none',paddingBottom:i<faqs.length-1?'1rem':0,marginBottom:i<faqs.length-1?'1rem':0}}>
                  <p style={{fontWeight:600,fontSize:'13.5px',color:'white',margin:'0 0 4px'}}>{faq.q}</p>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:'13px',lineHeight:1.65,margin:0}}>{faq.a}</p>
                </div>
              ))}
            </div>
          </FadeDiv>
        </div>
      </section>
      <style>{`@media(max-width:768px){.hero-grid{grid-template-columns:1fr!important;gap:2rem!important}.form-row{grid-template-columns:1fr!important}}`}</style>
    </MarketingShell>
  );
}
